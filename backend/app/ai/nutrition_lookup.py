"""Lookup of nutrition values from the built-in food reference table.

Fuzzy name matching. Returns the food dict or None. This is the single seam
where a real nutrition API (e.g. USDA FoodData Central) can be swapped in later.
"""
from app.data.foods import FOODS_DATABASE


def _normalize(name: str) -> str:
    return " ".join(name.lower().split())


def lookup_food(name: str) -> dict | None:
    q = _normalize(name or "")
    if not q:
        return None
    for food in FOODS_DATABASE:
        if _normalize(food["name"]) == q:
            return food
    for food in FOODS_DATABASE:
        if q in _normalize(food["name"]) or _normalize(food["name"]).split("(")[0].strip() in q:
            return food
    for food in FOODS_DATABASE:
        first = _normalize(food["name"]).split()[0]
        if first and first in q:
            return food
    return None
