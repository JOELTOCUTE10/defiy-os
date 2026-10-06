"""Finance: entries, savings goals, summary. Educational only — not a financial advisor."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user
from app.models.core import User
from app.models.finance import FinanceEntry, SavingsGoal
from app.services.xp import award_xp

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/entries")
def list_entries(kind: str | None = None, limit: int = 100,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(FinanceEntry).filter(FinanceEntry.user_id == user.id)
    if kind:
        q = q.filter(FinanceEntry.kind == kind)
    return q.order_by(FinanceEntry.date.desc(), FinanceEntry.id.desc()).limit(min(limit, 500)).all()


@router.post("/entries", status_code=201)
def create_entry(data: dict, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    e = FinanceEntry(user_id=user.id, kind=data.get("kind", "expense"),
                     amount=float(data.get("amount", 0) or 0),
                     category=data.get("category", "other"),
                     description=data.get("description"),
                     date=data.get("date") or date.today())
    db.add(e)
    db.commit()
    db.refresh(e)
    if e.kind == "savings":
        award_xp(db, user.id, "savings_contribution", "finance", e.id)
    return e


@router.delete("/entries/{e_id}", status_code=204)
def delete_entry(e_id: int, user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    e = db.query(FinanceEntry).filter(FinanceEntry.id == e_id,
                                      FinanceEntry.user_id == user.id).first()
    if not e:
        raise HTTPException(404, "Entry not found")
    db.delete(e)
    db.commit()


def _goal(db: Session, user_id: int, g_id: int) -> SavingsGoal:
    sg = db.query(SavingsGoal).filter(SavingsGoal.id == g_id,
                                      SavingsGoal.user_id == user_id).first()
    if not sg:
        raise HTTPException(404, "Savings goal not found")
    return sg


@router.get("/savings-goals")
def list_savings_goals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).all()


@router.post("/savings-goals", status_code=201)
def create_savings_goal(data: dict, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    sg = SavingsGoal(user_id=user.id, name=data.get("name", "Savings"),
                     target_amount=float(data.get("target_amount", 0) or 0),
                     current_amount=float(data.get("current_amount", 0) or 0),
                     deadline=data.get("deadline"), notes=data.get("notes"))
    db.add(sg)
    db.commit()
    db.refresh(sg)
    return sg


@router.patch("/savings-goals/{g_id}")
def update_savings_goal(g_id: int, data: dict, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    sg = _goal(db, user.id, g_id)
    for k in ("name", "target_amount", "current_amount", "deadline", "status", "notes"):
        if k in data:
            setattr(sg, k, data[k])
    db.commit()
    db.refresh(sg)
    return sg


@router.delete("/savings-goals/{g_id}", status_code=204)
def delete_savings_goal(g_id: int, user: User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    db.delete(_goal(db, user.id, g_id))
    db.commit()


@router.post("/savings-goals/{g_id}/contribute")
def contribute(g_id: int, data: dict, user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    amount = float(data.get("amount", 0) or 0)
    sg = _goal(db, user.id, g_id)
    sg.current_amount += amount
    if sg.target_amount and sg.current_amount >= sg.target_amount and sg.status == "active":
        sg.status = "completed"
    db.add(FinanceEntry(user_id=user.id, kind="savings", amount=amount,
                        category="savings", description=f"Contribution to {sg.name}",
                        date=date.today()))
    award_xp(db, user.id, "savings_contribution", "savings_goal", sg.id)
    db.commit()
    db.refresh(sg)
    return sg


@router.get("/summary")
def summary(days: int = 30, user: User = Depends(get_current_user),
            db: Session = Depends(get_db)):
    entries = db.query(FinanceEntry).filter(FinanceEntry.user_id == user.id).all()
    income = sum(e.amount for e in entries if e.kind == "income")
    expenses = sum(e.amount for e in entries if e.kind == "expense")
    savings = sum(e.amount for e in entries if e.kind == "savings")
    by_cat: dict[str, float] = {}
    for e in entries:
        if e.kind == "expense":
            by_cat[e.category or "other"] = by_cat.get(e.category or "other", 0.0) + e.amount
    biggest = sorted(({"category": k, "amount": round(v, 2)} for k, v in by_cat.items()),
                     key=lambda x: -x["amount"])[:5]
    return {"income": round(income, 2), "expenses": round(expenses, 2),
            "savings": round(savings, 2), "net": round(income - expenses - savings, 2),
            "spending_by_category": {k: round(v, 2) for k, v in by_cat.items()},
            "biggest_spending_categories": biggest}
