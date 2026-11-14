"""Gemini-based song metadata + "Did you know" facts.

Returns a dict shaped to slot into the dashboard's song_info field:
    {
      "originalRelease": str,
      "originalReleaseDate": str,
      "writtenBy": [str, ...],
      "genre": str,
      "facts": [{"category": str, "text": str}, ...],
    }

The caller is responsible for adding source/confidence/schema/foundAt wrappers
and for caching the result.
"""
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
FACT_COUNT = 6
REQUEST_TIMEOUT = 45  # answers often take 10-20 s; giving up early wastes a request
FACT_CATEGORIES = [
    "Behind the song",
    "The band",
    "In the studio",
    "Charts & records",
    "Where you've heard it",
    "Connections",
]


class RateLimited(Exception):
    """Gemini refused the request for quota reasons. retry_after is in seconds."""

    def __init__(self, retry_after, daily):
        super().__init__(f"rate limited, retry after {retry_after}s")
        self.retry_after = retry_after
        self.daily = daily


RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "originalRelease": {
            "type": "string",
            "description": "Title of the album or single the song first appeared on. Empty string if unknown.",
        },
        "originalReleaseDate": {
            "type": "string",
            "description": "First release date (YYYY, YYYY-MM, or YYYY-MM-DD). Empty string if unknown.",
        },
        "writtenBy": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Songwriters / composers / lyricists. Empty array if unknown.",
        },
        "genre": {
            "type": "string",
            "description": "Primary genre, e.g. 'Rock', 'Soul'. Empty string if unknown.",
        },
        "facts": {
            "type": "array",
            "maxItems": FACT_COUNT,
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": FACT_CATEGORIES},
                    "text": {
                        "type": "string",
                        "description": "One or two sentences, at most 180 characters.",
                    },
                },
                "required": ["category", "text"],
            },
        },
    },
    "required": ["originalRelease", "originalReleaseDate", "writtenBy", "genre", "facts"],
}


def is_configured():
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def _build_prompt(track, avoid_facts=None):
    artist = (track.get("artist") or "").strip()
    title = (track.get("title") or "").strip()
    album = (track.get("album") or "").strip()
    released = (track.get("released") or "").strip()

    context_lines = [f"Artist: {artist}", f"Title: {title}"]
    if album:
        context_lines.append(f"Album (as identified by Shazam): {album}")
    if released:
        context_lines.append(f"Release year (as identified by Shazam): {released}")
    context = "\n".join(context_lines)

    avoid_block = ""
    avoid_list = [fact for fact in (avoid_facts or []) if fact]
    if avoid_list:
        bullets = "\n".join(f"- {fact}" for fact in avoid_list)
        avoid_block = f"""
Facts already shown for this artist on other songs. Do not repeat them or
reword them; pick different facts:

{bullets}
"""

    categories = "\n".join(f"   - {name}" for name in FACT_CATEGORIES)
    return f"""You are a careful music historian writing "Did you know?" cards for a
vinyl listening display. Output JSON matching the provided schema.

ACCURACY RULES. These matter more than anything else:
- Only state facts you are certain are true and that are well documented in
  reliable published sources: interviews, liner notes, official biographies,
  documentaries, chart archives, major music press.
- Never make anything up. Do not guess, embellish, or fill gaps with details
  that merely sound plausible. No invented quotes, numbers, dates, places or
  people.
- If you are unsure about any detail of a fact, leave that fact out entirely.
- If you do not know this song or artist well, return few facts or an empty
  list. An empty list is a good answer; a wrong fact is a bad one.
- Do not attribute a fact to this song when it belongs to a different song,
  album, or artist with a similar name.
- The same rules apply to originalRelease, originalReleaseDate, writtenBy and
  genre: use an empty string or empty array rather than guessing.

FACT RULES. Return up to {FACT_COUNT} facts:
1. Each fact is one or two plain sentences, at most 180 characters, readable
   from across a room. No questions, no exclamation marks, no hype.
2. Label each with one category:
{categories}
3. Prefer a mix of categories, roughly half about the song itself and half
   about the album or the artist. Skip a category rather than force it.
4. Favour stories and specifics (how it was written or recorded, the gear or
   studio, where the name came from, famous uses in films and TV, covers and
   samples) over generic biography such as "formed in X, signed to Y".
5. Do not repeat the songwriter credits or release date as a fact on their own.
{avoid_block}
{context}
"""


def _post_gemini(api_key, payload):
    # The key goes in a header, not the address, so it never shows up in logs.
    request = Request(
        GEMINI_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    with urlopen(request, timeout=REQUEST_TIMEOUT) as response:
        return json.load(response)


def _extract_json_text(response):
    candidates = response.get("candidates") or []
    if not candidates:
        return None
    parts = (candidates[0].get("content") or {}).get("parts") or []
    for part in parts:
        text = part.get("text")
        if text:
            return text
    return None


def _coerce_fact(item):
    text = " ".join(str(item.get("text", "")).split())
    category = str(item.get("category", "")).strip()
    if category not in FACT_CATEGORIES:
        category = "Did you know"
    if not text:
        return None
    return {"category": category, "text": text}


def _coerce(payload):
    facts = []
    for item in payload.get("facts") or []:
        coerced = _coerce_fact(item) if isinstance(item, dict) else None
        if coerced:
            facts.append(coerced)
    return {
        "originalRelease": (payload.get("originalRelease") or "").strip(),
        "originalReleaseDate": (payload.get("originalReleaseDate") or "").strip(),
        "writtenBy": [
            str(name).strip()
            for name in (payload.get("writtenBy") or [])
            if str(name).strip()
        ][:8],
        "genre": (payload.get("genre") or "").strip(),
        "facts": facts[:FACT_COUNT],
    }


def _rate_limit_details(exc):
    """Reads Google's quota error: how long to wait, and whether it is the daily limit."""
    retry_after, daily = 60, False
    try:
        error = json.loads(exc.read().decode("utf-8")).get("error") or {}
    except (ValueError, OSError, AttributeError):
        return retry_after, daily
    for detail in error.get("details") or []:
        kind = detail.get("@type", "")
        if kind.endswith("RetryInfo"):
            delay = str(detail.get("retryDelay", "")).rstrip("s")
            try:
                retry_after = max(1, int(float(delay)))
            except ValueError:
                pass
        if kind.endswith("QuotaFailure"):
            for violation in detail.get("violations") or []:
                if "PerDay" in violation.get("quotaId", ""):
                    daily = True
    return retry_after, daily


def lookup(track, logger=None, avoid_facts=None):
    """Call Gemini for metadata + facts. Returns dict or None on failure.

    Raises RateLimited when Google refuses for quota reasons, so the caller can
    stop asking until the limit resets.

    avoid_facts: facts already shown for other songs by the same artist; passed
    to the prompt as a "don't repeat these" hint.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    payload = {
        "contents": [{"parts": [{"text": _build_prompt(track, avoid_facts=avoid_facts)}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
            # Low temperature: stick to what it knows rather than get creative.
            "temperature": 0.3,
        },
    }

    try:
        response = _post_gemini(api_key, payload)
    except HTTPError as exc:
        if exc.code == 429:
            retry_after, daily = _rate_limit_details(exc)
            if logger:
                logger("gemini", result="rate_limited", daily=daily, retry_after_seconds=retry_after)
            raise RateLimited(retry_after, daily) from None
        if logger:
            logger("gemini", result="http_error", status=exc.code)
        return None
    except (URLError, TimeoutError) as exc:
        if logger:
            logger("gemini", result="network_error", error=str(exc))
        return None

    text = _extract_json_text(response)
    if not text:
        if logger:
            logger("gemini", result="empty_response")
        return None

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        if logger:
            logger("gemini", result="parse_error", error=str(exc))
        return None

    return _coerce(parsed)
