#!/usr/bin/env python3
import asyncio
import json
import sys

from shazamio import Shazam


def text(value, fallback=""):
    return value if value else fallback


async def identify(path):
    shazam = Shazam(language="en-US", endpoint_country="US")
    return await shazam.recognize(path)


def summarize(result):
    track = result.get("track")
    if not track:
        print("No Shazam match.")
        return 1

    title = text(track.get("title"), "(unknown title)")
    subtitle = text(track.get("subtitle"), "(unknown artist)")
    sections = track.get("sections", [])
    metadata = {}
    for section in sections:
        for item in section.get("metadata", []):
            title_key = item.get("title")
            if title_key:
                metadata[title_key.lower()] = item.get("text", "")

    print(f"{subtitle} - {title}")
    if metadata.get("album"):
        print(f"album: {metadata['album']}")
    if metadata.get("released"):
        print(f"released: {metadata['released']}")
    if track.get("url"):
        print(f"url: {track['url']}")
    if track.get("images", {}).get("coverart"):
        print(f"cover: {track['images']['coverart']}")
    return 0


def main():
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: identify_shazam.py PATH_TO_AUDIO [--json]", file=sys.stderr)
        return 2

    result = asyncio.run(identify(sys.argv[1]))
    if len(sys.argv) == 3 and sys.argv[2] == "--json":
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0

    return summarize(result)


if __name__ == "__main__":
    raise SystemExit(main())
