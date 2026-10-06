"""Quote of the day — original motivational lines (no copyrighted quotations).

Selection is deterministic per (date, user-goal category) so every user sees a
stable quote for the day that can be personalized to their goals.
"""
import hashlib
from datetime import date

CATEGORIES = [
    "fitness", "discipline", "school", "money", "confidence",
    "growth", "recovery", "new_beginnings", "setbacks",
]

QUOTES = {
    "fitness": [
        "Every rep you do today is a deposit in the version of you that shows up stronger next month.",
        "You don't need a perfect workout. You need the workout you'll actually start.",
        "Strength isn't built in one session — it's built by coming back.",
        "The best workout is the one you finish. The second best is the one you start.",
        "Show up for ten minutes. Momentum does the rest.",
        "Progress hides in the days nobody claps for.",
        "Your body keeps an honest record of consistency. Feed it steady work.",
        "Train today like someone who believes next month's you is worth it.",
    ],
    "discipline": [
        "Discipline is remembering what you want on the days you don't feel like chasing it.",
        "Small promises, kept daily, build unshakeable trust in yourself.",
        "Motivation gets you started. Systems keep you moving.",
        "You rarely regret the session, the study block, the early night. You regret skipping them.",
        "Consistency beats intensity — every single week.",
        "The habit you keep when it's inconvenient is the one that changes you.",
        "Do the boring thing well, repeatedly. That's the secret.",
        "Discipline is just self-respect wearing work clothes.",
    ],
    "school": [
        "Thirty focused minutes beats three distracted hours. Study smart.",
        "Every page you read today is a question you'll answer with confidence later.",
        "Learning stacks quietly — then one day it looks like talent.",
        "Confusion is the feeling of understanding growing. Sit with it a little longer.",
        "Review beats re-reading. Test yourself — that's where learning locks in.",
        "Start with the hardest subject while your mind is freshest.",
        "Grades are feedback, not identity. Use them and move forward.",
        "Today's study session is tomorrow's calm during the test.",
    ],
    "money": [
        "Every dollar you don't spend today is a vote for the future you're building.",
        "Saving isn't restriction — it's paying your future self first.",
        "Small amounts, moved consistently, quietly become real savings.",
        "A budget isn't a cage. It's a map that tells your money where to go.",
        "Track it once, and you'll never wonder where it went.",
        "Wealth is built on boring repeatable choices, not one big win.",
        "Progress you can see is progress you'll keep.",
        "You don't need to earn more to start building habits with what you have.",
    ],
    "confidence": [
        "You've solved every hard day so far. That's a perfect record.",
        "Confidence isn't the absence of doubt — it's moving with doubt as a passenger.",
        "Speak to yourself like someone you're rooting for.",
        "The version of you that survives awkward beginnings is the one that grows.",
        "You don't need to feel ready. Readiness is built by doing.",
        "Comparison steals focus. Your only race is with yesterday's you.",
        "Courage is just fear that decided to try anyway.",
        "Stand like you belong. Eventually your mind catches up.",
    ],
    "growth": [
        "You're allowed to be a work in progress and proud of where you already are.",
        "Growth is quiet. Check the evidence, not the feeling.",
        "One percent better most days is a different person in a year.",
        "The goal isn't to be perfect. It's to be unrecognizable from where you started.",
        "Curiosity is free and compounds daily.",
        "Every skill you have was once impossible. Keep collecting impossibles.",
        "Progress is portable — it follows you into every new challenge.",
        "Become the kind of person your goals belong to.",
    ],
    "recovery": [
        "Rest is when your body cashes in the work. Don't skip the deposit.",
        "Recovery isn't lost time — it's where the gains get built.",
        "Sleep is the cheapest performance enhancer available to you.",
        "A lighter day is training too. Listen, adjust, keep moving.",
        "You can't pour from an empty tank. Refill on purpose.",
        "Slowing down on purpose is different from quitting.",
        "Your best days are usually built by your most consistent nights.",
        "Tired is information, not weakness.",
    ],
    "new_beginnings": [
        "Starting over isn't starting from zero — it's starting with experience.",
        "Day one beats someday. Begin small, begin now.",
        "New chapters feel like endings until you write a few pages.",
        "The plan doesn't have to be perfect. Direction first, details later.",
        "Small first steps are how big stories actually start.",
        "Today is an unspent day. Spend it on purpose.",
        "You don't need permission to begin again.",
        "Momentum starts tiny. Give it something to push.",
    ],
    "setbacks": [
        "A missed day is a data point, not a verdict. Take the next step.",
        "You don't need to restart. Just take the next small step forward.",
        "Setbacks are part of the plan — the plan is you keep going.",
        "Progress zigzags. Keep the average pointed up.",
        "The comeback is always stronger than the setback.",
        "Falling behind isn't failing. Staying down is optional.",
        "One hard week doesn't erase a hundred good days.",
        "Adjust, don't abandon. That's the whole method.",
    ],
}


def pick_quote(for_date: date, goal_category: str | None = None) -> dict:
    """Deterministic daily pick, biased toward the user's goals."""
    category = goal_category if goal_category in QUOTES else "growth"
    pool = QUOTES[category] + QUOTES["discipline"]
    seed = hashlib.sha256(f"{for_date.isoformat()}|{category}".encode()).hexdigest()
    index = int(seed[:8], 16) % len(pool)
    return {"text": pool[index], "category": category}
