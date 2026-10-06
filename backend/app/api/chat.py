"""AI chat: conversations, messages, meal photo analysis."""
import base64

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User, Conversation, Message
from app.schemas.chat import (ChatMessageIn, ChatMessageOut, ConversationCreate,
                              ConversationOut, ChatReply, MealAnalysis, MealAnalysisItem)
from app.ai import chat as chat_engine, gemini
from app.ai.actions import log_meal as action_log_meal

router = APIRouter(prefix="/chat", tags=["chat"])


def _get_conv(db: Session, user_id: int, conv_id: int) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.id == conv_id,
                                          Conversation.user_id == user_id).first()
    if not conv:
        raise HTTPException(404, "Conversation not found")
    return conv


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (db.query(Conversation).filter(Conversation.user_id == user.id)
            .order_by(Conversation.updated_date.desc()).all())


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def create_conversation(data: ConversationCreate, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    conv = Conversation(user_id=user.id, title=data.title or "New conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/conversations/{conv_id}", status_code=204)
def delete_conversation(conv_id: int, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    conv = _get_conv(db, user.id, conv_id)
    db.delete(conv)
    db.commit()


@router.get("/conversations/{conv_id}/messages", response_model=list[ChatMessageOut])
def list_messages(conv_id: int, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    _get_conv(db, user.id, conv_id)
    return (db.query(Message).filter(Message.conversation_id == conv_id)
            .order_by(Message.created_date, Message.id).all())


@router.post("/conversations/{conv_id}/messages", response_model=ChatReply)
def send_message(conv_id: int, data: ChatMessageIn,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = _get_conv(db, user.id, conv_id)
    user_msg = Message(conversation_id=conv.id, user_id=user.id, role="user",
                       content=data.content, source=data.source)
    db.add(user_msg)
    db.commit()
    assistant_msg, executed, no_engine = chat_engine.respond(db, user, conv.id,
                                                             data.content, data.source)
    return ChatReply(message=ChatMessageOut.model_validate(assistant_msg),
                     actions_executed=executed, no_engine=no_engine)


@router.post("/conversations/{conv_id}/analyze-meal", response_model=MealAnalysis)
def analyze_meal_photo(conv_id: int, payload: dict,
                       user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Identify foods + portions from a photo (Gemini vision). Estimates only.

    payload: {"image_base64": "...", "mime_type": "image/jpeg"}
    Returns identified items with nutrition ESTIMATES from the reference table,
    flagged is_estimate=True. The user confirms/corrects before the meal is saved.
    """
    _get_conv(db, user.id, conv_id)
    image = (payload or {}).get("photo_base64") or (payload or {}).get("image_base64", "")
    if not image:
        raise HTTPException(400, "No image provided")
    if not gemini.is_configured():
        raise HTTPException(501, "The AI engine is not connected yet — set GEMINI_API_KEY "
                                 "to enable meal photo analysis. You can still log meals manually.")
    raw_items = gemini.analyze_meal_photo(image, (payload or {}).get("mime_type", "image/jpeg"))
    if raw_items is None:
        raise HTTPException(502, "The AI engine couldn't analyze that photo. Try another one.")
    from app.ai.nutrition_lookup import lookup_food
    items = []
    for it in raw_items:
        name = str(it.get("name", "")).strip() or "food"
        qty = float(it.get("quantity", 1) or 1)
        unit = str(it.get("unit", "serving"))
        found = lookup_food(name)
        if found:
            scale = qty / (found.get("quantity", 1) or 1)
            items.append(MealAnalysisItem(
                name=name, quantity=qty, unit=unit,
                calories=round((found.get("calories") or 0) * scale, 1),
                protein_g=round((found.get("protein_g") or 0) * scale, 1),
                carbs_g=round((found.get("carbs_g") or 0) * scale, 1),
                fat_g=round((found.get("fat_g") or 0) * scale, 1),
                fiber_g=round((found.get("fiber_g") or 0) * scale, 1),
                is_estimate=True))
        else:
            items.append(MealAnalysisItem(name=name, quantity=qty, unit=unit, is_estimate=True))
    return MealAnalysis(items=items, notes=(
        "Estimates only — I identified likely foods and portion sizes. Please confirm or "
        "correct them before saving. Values come from the built-in food reference table, "
        "not from the photo itself."))
