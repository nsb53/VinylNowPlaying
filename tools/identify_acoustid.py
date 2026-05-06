#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
import urllib.error


def fingerprint(path):
    result = subprocess.run(
        ["fpcalc", "-json", path],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def lookup(api_key, duration, fp):
    params = urllib.parse.urlencode(
        {
            "client": api_key,
            "duration": int(round(duration)),
            "fingerprint": fp,
            "meta": "recordings+releasegroups+compress",
        }
    )
    request = urllib.request.Request(
        f"https://api.acoustid.org/v2/lookup?{params}",
        headers={
            "User-Agent": "vinyl-now-playing-prototype/0.1",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def summarize(response):
    results = response.get("results", [])
    if not results:
        print("No matches.")
        return

    for index, result in enumerate(results[:5], start=1):
        score = result.get("score", 0)
        print(f"{index}. score={score:.3f}")
        for recording in result.get("recordings", [])[:3]:
            title = recording.get("title", "(unknown title)")
            artists = ", ".join(artist.get("name", "") for artist in recording.get("artists", []))
            artist_text = artists if artists else "(unknown artist)"
            release_groups = recording.get("releasegroups", [])
            releases = ", ".join(group.get("title", "") for group in release_groups[:2] if group.get("title"))
            suffix = f" | releases: {releases}" if releases else ""
            print(f"   {artist_text} - {title}{suffix}")


def main():
    if len(sys.argv) != 2:
        print("Usage: identify_acoustid.py PATH_TO_WAV", file=sys.stderr)
        return 2

    api_key = os.environ.get("ACOUSTID_API_KEY")
    if not api_key:
        print("Missing ACOUSTID_API_KEY environment variable.", file=sys.stderr)
        return 2

    fp = fingerprint(sys.argv[1])
    try:
        response = lookup(api_key, fp["duration"], fp["fingerprint"])
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"AcoustID returned HTTP {error.code}: {body}", file=sys.stderr)
        return 1
    summarize(response)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
