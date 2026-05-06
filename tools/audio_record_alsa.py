#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Record a WAV sample from an ALSA input.")
    parser.add_argument("device")
    parser.add_argument("output")
    parser.add_argument("seconds", type=float)
    parser.add_argument("--rate", type=int, default=44100)
    parser.add_argument("--channels", type=int, default=2)
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "arecord",
        "-D",
        args.device,
        "-f",
        "S16_LE",
        "-c",
        str(args.channels),
        "-r",
        str(args.rate),
        "-d",
        str(max(1, int(round(args.seconds)))),
        "-t",
        "wav",
        str(output),
    ]
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr or result.stdout)
        return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
