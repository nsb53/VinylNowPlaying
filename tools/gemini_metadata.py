"""Gemini-based song metadata + trivia lookup.

Returns a dict shaped to slot into the dashboard's existing song_info field:
    {
      "originalRelease": str,
      "originalReleaseDate": str,
      "writtenBy": [str, ...],
      "genre": str,
      "trivia": [{"question": str, "answer": str}, ...],
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
TRIVIA_COUNT = 6
REQUEST_TIMEOUT = 20

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
        "trivia": {
            "type": "array",
            "minItems": 1,
            "maxItems": TRIVIA_COUNT,
            "items": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "enum": ["song", "album", "band"],
                        "description": "Which subject this question is about.",
                    },
                    "question": {"type": "string"},
                    "choices": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 4,
                        "maxItems": 4,
                        "description": "Exactly four plausible multiple-choice options.",
                    },
                    "correctIndex": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 3,
                        "description": "Index into 'choices' of the correct answer.",
                    },
                    "answer": {
                        "type": "string",
                        "description": "One-sentence explanation of why the correct choice is correct.",
                    },
                },
                "required": ["topic", "question", "choices", "correctIndex", "answer"],
            },
        },
    },
    "required": ["originalRelease", "originalReleaseDate", "writtenBy", "genre", "trivia"],
}


def is_configured():
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def _build_prompt(track, avoid_questions=None):
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
    avoid_list = [q for q in (avoid_questions or []) if q]
    if avoid_list:
        bullets = "\n".join(f"- {q}" for q in avoid_list)
        avoid_block = f"""
Recently-shown questions for this same artist (DO NOT repeat these or close
paraphrases of them — pick different angles):

{bullets}
"""

    return f"""You are a music historian compiling reference info for a vinyl listening
dashboard. Output JSON matching the provided schema.

Accuracy comes first. Every claim must be a real, verifiable fact from
published sources (interviews, liner notes, band biographies, documentaries).
If you are not confident a fact is true, exclude the question rather than
guess. It is better to return 3 solid items than {TRIVIA_COUNT} where one
is invented. Metadata fields (originalRelease, writtenBy, etc.): return empty
string or empty array if not confident. Never invent.

Trivia rules — return up to {TRIVIA_COUNT} multiple-choice questions:

1. Topic mix: aim for roughly 2 about the song itself, 2 about the album it
   came from, and 2 about the band/artist's broader career. Use the "topic"
   field to label each item.

2. Favor interesting angles over generic facts:
   - For SONG: inspiration behind the lyrics, where/when it was written, what
     was happening in the writers' lives at the time, recording-room stories,
     unusual instruments or takes, samples or covers it inspired.
   - For ALBUM: writing/recording location and circumstances, production
     quirks, cover art origin, sequencing or naming decisions, near-disasters
     during the sessions.
   - For BAND: band-name origin, pre-fame day jobs, unusual gear or recording
     techniques, side projects, weird fan-culture moments, unexpected
     collaborations, member quirks. Avoid generic biography ("formed in X,
     signed to Y").

3. AVOID these boring categories entirely:
   - Billboard chart positions, weeks at #1, sales figures, RIAA certifications
   - Grammy/award counts unless tied to a memorable story
   - "Who wrote it?" when the writer is already given in writtenBy

4. Difficulty: fan-knowledge level. Not obscure deep cuts, not trivia-night
   finals. Someone who likes the artist should be able to guess most of them.

5. Each item needs exactly 4 plausible choices. Distractors should be
   believable (same era, same genre, comparable artists or albums) — not
   obvious filler.

6. "answer" is a one-sentence factual explanation of why the correct choice
   is right.
{avoid_block}
{context}
"""


def _post_gemini(api_key, payload):
    request = Request(
        f"{GEMINI_ENDPOINT}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
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


def _coerce_trivia_item(item):
    question = str(item.get("question", "")).strip()
    choices = [str(choice).strip() for choice in (item.get("choices") or [])]
    choices = [choice for choice in choices if choice]
    answer = str(item.get("answer", "")).strip()
    topic = str(item.get("topic", "")).strip().lower()
    if topic not in ("song", "album", "band"):
        topic = "song"
    try:
        correct_index = int(item.get("correctIndex"))
    except (TypeError, ValueError):
        return None
    if not question or not answer or len(choices) != 4:
        return None
    if not 0 <= correct_index < len(choices):
        return None
    return {
        "topic": topic,
        "question": question,
        "choices": choices,
        "correctIndex": correct_index,
        "answer": answer,
    }


def _coerce(payload):
    trivia_items = []
    for item in payload.get("trivia") or []:
        coerced = _coerce_trivia_item(item)
        if coerced:
            trivia_items.append(coerced)
    return {
        "originalRelease": (payload.get("originalRelease") or "").strip(),
        "originalReleaseDate": (payload.get("originalReleaseDate") or "").strip(),
        "writtenBy": [
            str(name).strip()
            for name in (payload.get("writtenBy") or [])
            if str(name).strip()
        ][:8],
        "genre": (payload.get("genre") or "").strip(),
        "trivia": trivia_items[:TRIVIA_COUNT],
    }


def lookup(track, logger=None, avoid_questions=None):
    """Call Gemini for metadata + trivia. Returns dict or None on failure.

    avoid_questions: optional list of previously-shown trivia questions for the
    same artist; passed to the prompt as a "don't repeat these" hint.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    payload = {
        "contents": [{"parts": [{"text": _build_prompt(track, avoid_questions=avoid_questions)}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
            "temperature": 0.8,
        },
    }

    try:
        response = _post_gemini(api_key, payload)
    except HTTPError as exc:
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
