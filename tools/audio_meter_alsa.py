#!/usr/bin/env python3
import argparse
from array import array
import json
import math
import signal
import subprocess
import sys
import time


stop = False


def handle_signal(_signum, _frame):
    global stop
    stop = True


def dbfs(value):
    if value <= 0:
        return -120.0
    return max(-120.0, 20.0 * math.log10(value / 32768.0))


def levels_from_pcm(data, channels):
    samples = array("h")
    samples.frombytes(data[: len(data) - (len(data) % 2)])
    if sys.byteorder != "little":
        samples.byteswap()
    if not samples:
        return None

    sums = [0.0 for _ in range(channels)]
    peaks = [0 for _ in range(channels)]
    counts = [0 for _ in range(channels)]
    channel = 0
    for sample in samples:
        absolute = abs(sample)
        sums[channel] += sample * sample
        if absolute > peaks[channel]:
            peaks[channel] = absolute
        counts[channel] += 1
        channel += 1
        if channel == channels:
            channel = 0

    rms_values = [
        math.sqrt(sums[channel] / counts[channel]) if counts[channel] else 0
        for channel in range(channels)
    ]
    combined_rms = math.sqrt(sum(value * value for value in rms_values) / max(1, channels))
    combined_peak = max(peaks) if peaks else 0

    result = {
        "rmsDb": round(dbfs(combined_rms), 1),
        "peakDb": round(dbfs(combined_peak), 1),
    }
    if channels >= 2:
        result.update(
            {
                "leftRmsDb": round(dbfs(rms_values[0]), 1),
                "leftPeakDb": round(dbfs(peaks[0]), 1),
                "rightRmsDb": round(dbfs(rms_values[1]), 1),
                "rightPeakDb": round(dbfs(peaks[1]), 1),
            }
        )
    return result


def print_plain(levels):
    pieces = [f"rms={levels['rmsDb']} dBFS peak={levels['peakDb']} dBFS"]
    if "leftRmsDb" in levels:
        pieces.append(
            "leftRms={leftRmsDb} dBFS leftPeak={leftPeakDb} dBFS rightRms={rightRmsDb} dBFS rightPeak={rightPeakDb} dBFS".format(
                **levels
            )
        )
    print(" ".join(pieces), flush=True)


def main():
    parser = argparse.ArgumentParser(description="Read live ALSA levels as plain text or JSON lines.")
    parser.add_argument("device")
    parser.add_argument("seconds", type=float, nargs="?", default=0.5)
    parser.add_argument("window", type=float, nargs="?", default=0.12)
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--rate", type=int, default=44100)
    parser.add_argument("--channels", type=int, default=2)
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

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
        "-t",
        "raw",
        "-q",
    ]
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    bytes_per_window = max(2 * args.channels, int(args.rate * args.window) * 2 * args.channels)
    end_at = None if args.stream else time.time() + args.seconds

    try:
        while not stop and (end_at is None or time.time() < end_at):
            data = process.stdout.read(bytes_per_window)
            if not data:
                break
            levels = levels_from_pcm(data, args.channels)
            if not levels:
                continue
            if args.stream:
                print(json.dumps(levels), flush=True)
            else:
                print_plain(levels)
        return 0
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=1)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
