"""Explicit command parser used when the Gemini engine is not configured.

This is NOT a fake AI: it is a deterministic parser for clearly-worded
commands, and the chat always tells the user when the AI engine is offline.
Supported patterns:
  remind me to X at 7pm / at 7:30 pm / tomorrow at 8am / in 10 minutes
  log my meal|breakfast|lunch|dinner: eggs, toast and a banana
  I ate two eggs, toast and a banana
  create a goal to save $500 / save $500
  add my test|homework|project on friday
  log my sleep (last night) / slept 7 hours
  water / drank water / I drank 500ml of water
  show me my progress
"""
import re
from datetime import date, datetime, timedelta

MONTHS = {m.lower(): i + 1 for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July",
     "August", "September", "October", "November", "December"])}

MEAL_TYPES = {"breakfast": "breakfast", "lunch": "lunch", "dinner": "dinner", "snack": "snack"}


def _parse_time(text: str) -> datetime | None:
    """Find 'at 7', 'at 7pm', 'at 7:30 pm', 'tomorrow at 8am', 'in 10 minutes' style times."""
    now = datetime.now()
    m = re.search(r"in (\d+) (second|minute|hour)s?", text, re.I)
    if m:
        n, unit = int(m.group(1)), m.group(2).lower()
        delta = timedelta(seconds=n) if unit == "second" else timedelta(minutes=n) if unit == "minute" else timedelta(hours=n)
        return now + delta
    base_date = now
    if re.search(r"\btomorrow\b", text, re.I):
        base_date = now + timedelta(days=1)
    for wd, idx in [("monday", 0), ("tuesday", 1), ("wednesday", 2), ("thursday", 3), ("friday", 4), ("saturday", 5), ("sunday", 6)]:
        if re.search(rf"\b{wd}\b", text, re.I):
            days_ahead = (idx - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            base_date = now + timedelta(days=days_ahead)
    m = re.search(r"\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", text, re.I)
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        mer = (m.group(3) or "").lower()
        if mer == "pm" and hour < 12:
            hour += 12
        if mer == "am" and hour == 12:
            hour = 0
        if not mer and hour < 8:      # "at 7" in the evening context -> 7pm
            hour += 12
        return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if base_date != now:
        return base_date.replace(hour=9, minute=0, second=0, microsecond=0)
    return None


def _split_items(text: str) -> list[dict]:
    parts = re.split(r",| and ", text)
    items = []
    for p in parts:
        p = p.strip().strip(".")
        if not p or len(p) < 2:
            continue
        m = re.match(r"(?:(\d+|a|an|two|three|four|five|six|seven|eight|nine|ten)\s+)?(.+)", p, re.I)
        if not m:
            continue
        num_word = {"a": 1, "an": 1, "two": 2, "three": 3, "four": 4, "five": 5,
                    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
        qty = m.group(1)
        qty = num_word.get((qty or "").lower(), None) or (int(qty) if qty and qty.isdigit() else 1)
        items.append({"name": m.group(2).strip(), "quantity": qty, "unit": "serving"})
    return items


def parse(text: str) -> list[dict]:
    """Return a list of {action, args} dicts, or [] if nothing matches."""
    t = text.strip()
    low = t.lower()
    actions = []

    m = re.search(r"remind me (?:to |about |that )?(.+?)(?:\s+at .+|\s+tomorrow.*|\s+every .+)?$", t, re.I)
    if re.match(r"^remind me", low):
        title = (m.group(1) if m else t[10:]).strip(" .") or "Reminder"
        remind_at = _parse_time(t)
        repeat = "none"
        repeat_day = None
        if re.search(r"every (day|daily)", low):
            repeat = "daily"
        elif re.search(r"every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)", low):
            repeat = "weekly"
            for wd, idx in [("monday", 0), ("tuesday", 1), ("wednesday", 2), ("thursday", 3), ("friday", 4), ("saturday", 5), ("sunday", 6)]:
                if wd in low:
                    repeat_day = idx
        actions.append({"action": "create_reminder", "args": {
            "title": title, "remind_at": remind_at.isoformat() if remind_at else None,
            "repeat": repeat, "repeat_day": repeat_day}})

    meal_m = re.search(r"(?:log (?:my |the )?(breakfast|lunch|dinner|meal|snack)[,:]?\s*|i (?:ate|had) )(.+)", t, re.I)
    if meal_m:
        meal_type = MEAL_TYPES.get((meal_m.group(1) or "").lower(), "lunch")
        items = _split_items(meal_m.group(2))
        actions.append({"action": "log_meal", "args": {
            "title": (meal_m.group(1) or "Meal").title(), "meal_type": meal_type, "items": items}})

    goal_m = re.search(r"(?:goal to )?save \$?([\d,.]+)", low)
    if goal_m and re.search(r"goal|save", low):
        actions.append({"action": "create_savings_goal", "args": {
            "name": f"Save ${goal_m.group(1)}", "target_amount": float(goal_m.group(1).replace(",", ""))}})

    add_m = re.search(r"^add .*?(test|quiz|homework|project)\b", low)
    if add_m:
        kind = add_m.group(1)
        title_m = re.search(r"(?:add|adding) (?:my |a |an )?(.*?)(?:\s+(?:test|quiz|homework|project))", t, re.I)
        raw = (title_m.group(1).strip(" .") if title_m else "").strip()
        if not raw:
            raw = "Upcoming " + kind
        actions.append({"action": "create_assignment", "args": {"title": raw.title(), "type": kind}})

    sleep_m = re.search(r"(?:i )?(?:slept|sleep(?:ed)?) (?:for )?(\d+(?:\.\d+)?)\s*hours", low)
    if sleep_m:
        actions.append({"action": "log_sleep", "args": {"total_minutes": int(float(sleep_m.group(1)) * 60)}})
    elif re.search(r"^log (?:my )?sleep", low):
        actions.append({"action": "log_sleep", "args": {}})

    water_m = re.search(r"(\d{2,4})\s*ml of water|drank water|log water", low)
    if water_m:
        ml = int(water_m.group(1)) if water_m.group(1) else 250
        actions.append({"action": "set_water", "args": {"ml": ml}})

    if re.search(r"show (?:me )?(?:my )?progress", low):
        actions.append({"action": "show_progress", "args": {}})

    return actions[:3]  # safety cap
