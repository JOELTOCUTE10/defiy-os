"""Chat orchestration: Gemini (when configured) or the honest fallback."""
from sqlalchemy.orm import Session

from app.models.core import User, Conversation, Message
from . import gemini
from .actions import execute_action
from .fallback_parser import parse
from .prompts import SYSTEM_PROMPT, build_context

NO_ENGINE_PREFIX = ("I'm on it — but note the AI engine isn't connected yet "
                    "(set the GEMINI_API_KEY environment variable to enable full coaching). "
                    "Meanwhile I still handle explicit commands.\n\n")


def _history(db: Session, conversation_id: int, limit: int = 12) -> str:
    msgs = (db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_date.desc(), Message.id.desc())
            .limit(limit).all())
    msgs.reverse()
    out = []
    for m in msgs:
        who = "User" if m.role == "user" else "Defiy"
        out.append(f"{who}: {m.content}")
    return "\n".join(out)


def respond(db: Session, user: User, conversation_id: int, content: str, source: str = "text"):
    """Process a chat turn. Returns (assistant_message, executed_actions, no_engine)."""
    context = build_context(db, user.id)
    history = _history(db, conversation_id)
    executed, no_engine = [], False

    if gemini.is_configured():
        prompt = (
            f"{SYSTEM_PROMPT}\n\n=== USER CONTEXT (real data) ===\n{context}\n\n"
            f"=== RECENT CONVERSATION ===\n{history}\n\n"
            f"=== NEW USER MESSAGE ===\n{content}\n\n"
            "Respond with JSON only: {\"reply\": \"...\", \"actions\": [...]}"
        )
        data = gemini.generate_json(prompt)
        if data:
            reply = str(data.get("reply") or "").strip() or "I'm here. What would you like to work on?"
            for act in (data.get("actions") or [])[:5]:
                result = execute_action(db, user, act.get("action", ""), act.get("args") or {})
                executed.append({"action": act.get("action", ""),
                                 "summary": result.get("summary", ""),
                                 "result_id": result.get("result_id"),
                                 "status": "done" if result.get("ok") else "failed"})
        else:
            # Gemini configured but call failed — be honest, still run explicit commands.
            reply = ("I couldn't reach the AI engine just now (connection problem — I'll try "
                     "again next message). I can still handle explicit commands.")
            no_engine = True
            executed = _fallback(db, user, content)
            if executed:
                reply = NO_ENGINE_PREFIX + "\n".join(e["summary"] for e in executed)
    else:
        no_engine = True
        executed = _fallback(db, user, content)
        if executed:
            reply = NO_ENGINE_PREFIX + "\n".join(e["summary"] for e in executed)
        else:
            reply = (NO_ENGINE_PREFIX +
                     "Try things like: \"Remind me to study at 7pm\", \"I ate two eggs and toast\", "
                     "\"I want to save $500\", \"Add my chemistry test on Friday\", "
                     "\"I slept 7 hours\", or \"Show me my progress\".")

    msg = Message(conversation_id=conversation_id, user_id=user.id, role="assistant",
                  content=reply, actions=executed, source="text")
    db.add(msg)
    conv = db.query(Conversation).get(conversation_id)
    if conv and conv.title == "New conversation" and content:
        conv.title = content[:60]
    db.commit()
    db.refresh(msg)
    return msg, executed, no_engine


def _fallback(db: Session, user: User, content: str) -> list[dict]:
    executed = []
    for act in parse(content):
        result = execute_action(db, user, act["action"], act["args"])
        executed.append({"action": act["action"], "summary": result.get("summary", ""),
                         "result_id": result.get("result_id"),
                         "status": "done" if result.get("ok") else "failed"})
    return executed
