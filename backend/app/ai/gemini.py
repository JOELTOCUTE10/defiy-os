"""Google Gemini adapter (server-side only; key never reaches the client).

Returns None whenever the key is unset or the call fails — callers must handle
that honestly instead of pretending the AI answered.
"""
import json
import re

import httpx

from app.config import settings

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def is_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)


def generate(prompt: str, temperature: float = 0.7) -> str | None:
    """Plain-text generation. Returns None when unavailable or on error."""
    if not is_configured():
        return None
    try:
        resp = httpx.post(
            f"{API_BASE}/{settings.GEMINI_MODEL}:generateContent",
            params={"key": settings.GEMINI_API_KEY},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temperature, "maxOutputTokens": 2048},
            },
            timeout=30,
        )
        resp.raise_for_status()
        candidates = resp.json().get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts) or None
    except Exception:
        return None


def generate_json(prompt: str, temperature: float = 0.4) -> dict | None:
    """JSON generation with robust extraction (strips code fences etc.)."""
    text = generate(prompt, temperature)
    if not text:
        return None
    return extract_json(text)


def extract_json(text: str) -> dict | None:
    """Best-effort extraction of a JSON object from model output."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence:
        text = fence.group(1)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None


def analyze_meal_photo(image_base64: str, mime_type: str = "image/jpeg") -> list[dict] | None:
    """Ask Gemini to identify foods and estimate portions from a meal photo.

    Deliberately asks ONLY for identification + portion ESTIMATES, never
    nutrition numbers — the app computes nutrition from its reference table.
    """
    if not is_configured():
        return None
    prompt = (
        "Look at this food photo. Identify the likely foods and estimate portion sizes. "
        "Respond with JSON only: {\"items\": [{\"name\": str, \"quantity\": number, \"unit\": str}], "
        "\"notes\": str}. Names should be simple and generic (e.g. 'chicken breast', 'white rice', "
        "'mixed salad'). These are ESTIMATES — if something is uncertain, say so in notes. "
        "Do NOT include nutrition values."
    )
    try:
        resp = httpx.post(
            f"{API_BASE}/{settings.GEMINI_MODEL}:generateContent",
            params={"key": settings.GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": mime_type, "data": image_base64}},
                    ]
                }],
                "generationConfig": {"temperature": 0.2},
            },
            timeout=30,
        )
        resp.raise_for_status()
        candidates = resp.json().get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts)
        data = extract_json(text)
        return data.get("items", []) if data else None
    except Exception:
        return None
