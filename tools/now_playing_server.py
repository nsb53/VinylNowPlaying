#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
WEB_ROOT = ROOT / "web"
STATE_PATH = ROOT / "state" / "now-playing.json"
SETTINGS_PATH = ROOT / "state" / "settings.json"
SYNCED_TIME_RE = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\]")
APP_VERSION = "0.4.0"


def load_settings():
    if not SETTINGS_PATH.exists():
        return {}
    try:
        return json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_settings(settings):
    SETTINGS_PATH.parent.mkdir(exist_ok=True)
    SETTINGS_PATH.write_text(json.dumps(settings, indent=2), encoding="utf-8")


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def log_event(event, **fields):
    timestamp = datetime.now().strftime("%H:%M:%S")
    details = " ".join(f"{key}={value}" for key, value in fields.items() if value is not None)
    suffix = f" {details}" if details else ""
    print(f"[{timestamp}] [{event}]{suffix}", flush=True)


def resolve_audio_backend(args):
    if args.audio_backend != "auto":
        return args.audio_backend
    return "coreaudio" if sys.platform == "darwin" else "alsa"


def audio_device(args):
    if args.resolved_audio_backend == "alsa" and args.alsa_device:
        return args.alsa_device
    return args.device


def capture_command(args, sample_path, seconds):
    if args.resolved_audio_backend == "alsa":
        return [
            sys.executable,
            "tools/audio_record_alsa.py",
            audio_device(args),
            str(sample_path.relative_to(ROOT)),
            str(seconds),
            "--rate",
            str(args.alsa_rate),
            "--channels",
            str(args.alsa_channels),
        ]
    return [
        "swift",
        "-module-cache-path",
        ".swift-cache",
        "tools/audio_record.swift",
        args.device,
        str(sample_path.relative_to(ROOT)),
        str(seconds),
    ]


def meter_command(args):
    if args.resolved_audio_backend == "alsa":
        return [
            sys.executable,
            "tools/audio_meter_alsa.py",
            audio_device(args),
            "0.5",
            str(args.level_window),
            "--stream",
            "--rate",
            str(args.alsa_rate),
            "--channels",
            str(args.alsa_channels),
        ]
    return [
        "swift",
        "-module-cache-path",
        ".swift-cache",
        "tools/audio_meter.swift",
        args.device,
        "0.5",
        str(args.level_window),
        "--stream",
    ]


def run_command(args, timeout, low_priority=False):
    preexec_fn = (lambda: os.nice(10)) if low_priority and os.name == "posix" else None
    return subprocess.run(
        args,
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=timeout,
        preexec_fn=preexec_fn,
    )


def parse_level(output):
    combined = re.search(r"rms=([-.\d]+) dBFS peak=([-.\d]+) dBFS", output)
    stereo = re.search(
        r"leftRms=([-.\d]+) dBFS leftPeak=([-.\d]+) dBFS rightRms=([-.\d]+) dBFS rightPeak=([-.\d]+) dBFS",
        output,
    )
    if not combined:
        return {}

    levels = {
        "rmsDb": float(combined.group(1)),
        "peakDb": float(combined.group(2)),
        "updatedAt": utc_now(),
    }
    if stereo:
        levels.update(
            {
                "leftRmsDb": float(stereo.group(1)),
                "leftPeakDb": float(stereo.group(2)),
                "rightRmsDb": float(stereo.group(3)),
                "rightPeakDb": float(stereo.group(4)),
            }
        )
    return levels


def track_from_shazam(result):
    track = result.get("track")
    if not track:
        return None

    metadata = {}
    for section in track.get("sections", []):
        for item in section.get("metadata", []):
            title = item.get("title")
            if title:
                metadata[title.lower()] = item.get("text", "")

    offsets = [
        match.get("offset")
        for match in result.get("matches", [])
        if isinstance(match.get("offset"), (int, float))
    ]

    return {
        "id": str(track.get("key") or ""),
        "title": track.get("title") or "Unknown Title",
        "artist": track.get("subtitle") or "Unknown Artist",
        "album": metadata.get("album", ""),
        "released": metadata.get("released", ""),
        "url": track.get("url", ""),
        "cover": track.get("images", {}).get("coverart", ""),
        "recognizedAt": utc_now(),
        "recognizedOffset": min(offsets) if offsets else None,
        "provider": "shazam",
    }


def normalize_text(value):
    return (value or "").strip().casefold().replace("’", "'").replace("‐", "-")


def synced_lyrics_end(lyrics):
    if not lyrics or not lyrics.get("synced"):
        return None
    times = []
    for line in lyrics["synced"].splitlines():
        match = SYNCED_TIME_RE.match(line)
        if match:
            times.append(int(match.group(1)) * 60 + float(match.group(2)))
    return max(times) if times else None


def playback_position(track, lyric_offset_seconds=0):
    if not track or not track.get("recognizedAt"):
        return None
    offset = track.get("recognizedOffset")
    if not isinstance(offset, (int, float)):
        offset = 0
    elapsed = datetime.now(timezone.utc) - datetime.fromisoformat(track["recognizedAt"])
    return offset + elapsed.total_seconds() + lyric_offset_seconds


def lyrics_score(track, candidate):
    score = 0
    if normalize_text(candidate.get("trackName")) == normalize_text(track.get("title")):
        score += 4
    if normalize_text(candidate.get("artistName")) == normalize_text(track.get("artist")):
        score += 3
    if track.get("album") and normalize_text(candidate.get("albumName")) == normalize_text(track.get("album")):
        score += 2
    if candidate.get("syncedLyrics"):
        score += 1
    return score


def lookup_lyrics(track):
    params = {
        "track_name": track.get("title", ""),
        "artist_name": track.get("artist", ""),
    }
    if track.get("album"):
        params["album_name"] = track["album"]

    request = Request(
        "https://lrclib.net/api/search?" + urlencode(params),
        headers={"User-Agent": "vinyl-now-playing-prototype/0.1 (local dashboard)"},
    )
    log_event("lyrics", action="search", artist=track.get("artist", ""), title=track.get("title", ""))
    with urlopen(request, timeout=12) as response:
        candidates = json.load(response)

    if not candidates:
        log_event("lyrics", result="no_candidates")
        return None

    best = max(candidates, key=lambda candidate: lyrics_score(track, candidate))
    if not best.get("plainLyrics") and not best.get("syncedLyrics") and not best.get("instrumental"):
        log_event("lyrics", result="no_lyrics")
        return None

    log_event(
        "lyrics",
        result="matched",
        lrclib_id=best.get("id"),
        synced=bool(best.get("syncedLyrics")),
        plain=bool(best.get("plainLyrics")),
    )
    return {
        "id": best.get("id"),
        "source": "LRCLIB",
        "trackName": best.get("trackName", ""),
        "artistName": best.get("artistName", ""),
        "albumName": best.get("albumName", ""),
        "duration": best.get("duration"),
        "instrumental": bool(best.get("instrumental")),
        "plain": best.get("plainLyrics") or "",
        "synced": best.get("syncedLyrics") or "",
        "foundAt": utc_now(),
    }


def manual_track_from_spec(spec, index, default_artist="", default_album="", default_released=""):
    if isinstance(spec, str):
        raw = spec.strip()
        if " - " in raw:
            artist, title = raw.split(" - ", 1)
        else:
            artist, title = default_artist, raw
        spec = {"artist": artist.strip(), "title": title.strip()}

    title = (spec.get("title") or "").strip()
    artist = (spec.get("artist") or default_artist or "").strip()
    album = (spec.get("album") or default_album or "").strip()
    released = (spec.get("released") or default_released or "").strip()
    if not title:
        return None

    track = {
        "id": f"manual:{normalize_text(artist)}:{normalize_text(title)}:{index}",
        "title": title,
        "artist": artist or "Unknown Artist",
        "album": album,
        "released": released,
        "url": "",
        "cover": "",
        "recognizedAt": utc_now(),
        "recognizedOffset": 0,
        "provider": "manual",
    }
    try:
        track["lyrics"] = lookup_lyrics(track)
    except Exception as exc:
        track["lyrics"] = None
        track["lyricsError"] = str(exc)
    return track


def same_track(left, right):
    if not left or not right:
        return False
    if left.get("id") and right.get("id"):
        return left["id"] == right["id"]
    return (
        left.get("title", "").casefold(),
        left.get("artist", "").casefold(),
    ) == (
        right.get("title", "").casefold(),
        right.get("artist", "").casefold(),
    )


@dataclass
class DashboardState:
    status: str = "starting"
    message: str = "Starting recognition loop"
    current: Optional[dict] = None
    previous: Optional[dict] = None
    lastScan: Optional[dict] = None
    level: Optional[dict] = None
    nextScanAt: Optional[str] = None
    history: list = field(default_factory=list)
    config: dict = field(default_factory=dict)
    lyricOffsetSeconds: float = 0
    lyricScroll: int = 0
    manualQueue: list = field(default_factory=list)
    manualIndex: int = -1
    manualMode: bool = False
    error: Optional[str] = None

    def as_dict(self):
        return {
            "status": self.status,
            "message": self.message,
            "current": self.current,
            "previous": self.previous,
            "lastScan": self.lastScan,
            "level": self.level,
            "nextScanAt": self.nextScanAt,
            "history": self.history[-10:],
            "config": self.config,
            "lyricOffsetSeconds": self.lyricOffsetSeconds,
            "lyricScroll": self.lyricScroll,
            "manualQueue": self.manualQueue,
            "manualIndex": self.manualIndex,
            "manualMode": self.manualMode,
            "error": self.error,
        }


class NowPlayingService:
    def __init__(self, args):
        self.settings = load_settings()
        lyric_default_offset = float(
            self.settings.get("defaultLyricOffsetSeconds", args.lyric_default_offset)
        )
        meter_display_mode = self.settings.get("meterDisplayMode", "vu")
        if meter_display_mode not in ("vu", "spectrum"):
            meter_display_mode = "vu"
        self.args = args
        self.lock = threading.Lock()
        self.scan_requested = threading.Event()
        self.stop_requested = threading.Event()
        self.scanning = threading.Lock()
        self.audio_lock = threading.Lock()
        self.level_process = None
        self.music_active_since = None
        self.last_loud_at = None
        self.track_gap_cleared = False
        self.manual_started_at = None
        self.state = DashboardState(
            config={
                "device": audio_device(args),
                "appVersion": APP_VERSION,
                "audioBackend": args.resolved_audio_backend,
                "intervalSeconds": args.interval,
                "primarySampleSeconds": args.primary_seconds,
                "fallbackSampleSeconds": args.fallback_seconds,
                "levelWindowSeconds": args.level_window,
                "silenceThresholdDb": args.silence_threshold,
                "musicStartSeconds": args.music_start_seconds,
                "trackGapSilenceSeconds": args.track_gap_silence_seconds,
                "clearOnTrackGap": args.clear_on_track_gap,
                "silenceHoldSeconds": args.silence_hold_seconds,
                "manualClearSilenceSeconds": args.manual_clear_silence_seconds,
                "nowPlayingClearSilenceSeconds": args.now_playing_clear_silence_seconds,
                "defaultLyricOffsetSeconds": lyric_default_offset,
                "meterDisplayMode": meter_display_mode,
            }
        )
        self.state.lyricOffsetSeconds = lyric_default_offset

    def idle_message(self):
        return "Detected silence" if self.track_gap_cleared else "Waiting for music"

    def snapshot(self):
        with self.lock:
            return self.state.as_dict()

    def level_snapshot(self):
        with self.lock:
            return self.state.level or {}

    def settings_snapshot(self):
        with self.lock:
            return {
                "defaultLyricOffsetSeconds": self.state.config["defaultLyricOffsetSeconds"],
                "meterDisplayMode": self.state.config["meterDisplayMode"],
            }

    def update(self, **changes):
        with self.lock:
            for key, value in changes.items():
                setattr(self.state, key, value)
            self.write_state_locked()

    def write_state_locked(self):
        STATE_PATH.parent.mkdir(exist_ok=True)
        STATE_PATH.write_text(json.dumps(self.state.as_dict(), indent=2), encoding="utf-8")

    def request_scan(self):
        self.scan_requested.set()

    def adjust_lyrics(self, offset_delta=0, scroll_delta=0, reset_scroll=False, reset_offset=False):
        with self.lock:
            if reset_offset:
                self.state.lyricOffsetSeconds = self.state.config["defaultLyricOffsetSeconds"]
            else:
                self.state.lyricOffsetSeconds += offset_delta
            if reset_scroll:
                self.state.lyricScroll = 0
            else:
                self.state.lyricScroll = max(0, self.state.lyricScroll + scroll_delta)
            self.write_state_locked()
            return {
                "lyricOffsetSeconds": self.state.lyricOffsetSeconds,
                "lyricScroll": self.state.lyricScroll,
            }

    def set_manual_track_locked(self, index):
        if index < 0 or index >= len(self.state.manualQueue):
            return None
        track = dict(self.state.manualQueue[index])
        track["recognizedAt"] = utc_now()
        track["recognizedOffset"] = 0
        self.state.previous = self.state.current
        self.state.current = track
        self.state.manualQueue[index] = track
        self.state.manualIndex = index
        self.state.manualMode = True
        self.manual_started_at = time.time()
        self.state.lyricOffsetSeconds = 0
        self.state.lyricScroll = 0
        self.state.status = "manual"
        self.state.message = "Manual track override"
        self.state.error = None
        self.state.history.append(track)
        self.write_state_locked()
        return track

    def clear_manual_locked(self, message="Manual override cleared"):
        self.state.manualQueue = []
        self.state.manualIndex = -1
        self.state.manualMode = False
        self.manual_started_at = None
        self.state.status = "idle"
        self.state.message = message
        self.write_state_locked()

    def silence_seconds_locked(self, now=None):
        now = now or time.time()
        if self.last_loud_at is not None:
            return now - self.last_loud_at
        if self.music_active_since is not None:
            return now - self.music_active_since
        return None

    def clear_now_playing_after_silence_if_needed_locked(self, now=None):
        if not self.state.current and not self.state.previous and not self.state.history:
            return False
        silence_seconds = self.silence_seconds_locked(now)
        if silence_seconds is None or silence_seconds < self.args.now_playing_clear_silence_seconds:
            return False
        self.state.current = None
        self.state.previous = None
        self.state.history = []
        self.state.lyricOffsetSeconds = self.state.config["defaultLyricOffsetSeconds"]
        self.state.lyricScroll = 0
        self.state.status = "idle"
        self.state.message = "Waiting for music"
        self.write_state_locked()
        return True

    def clear_now_playing_for_track_gap_locked(self):
        if (
            not self.args.clear_on_track_gap
            or self.state.manualMode
            or not self.state.current
        ):
            return False
        self.state.previous = self.state.current
        self.state.current = None
        self.state.lyricOffsetSeconds = self.state.config["defaultLyricOffsetSeconds"]
        self.state.lyricScroll = 0
        self.state.status = "idle"
        self.state.message = "Detected silence"
        self.state.nextScanAt = None
        self.write_state_locked()
        return True

    def manual_silence_timed_out_locked(self, now=None):
        if not self.state.manualMode:
            return False
        now = now or time.time()
        anchors = [
            value for value in (self.last_loud_at, self.manual_started_at) if value is not None
        ]
        silence_started_at = max(anchors) if anchors else None
        return bool(
            silence_started_at
            and now - silence_started_at >= self.args.manual_clear_silence_seconds
        )

    def clear_manual_after_silence_if_needed(self):
        with self.lock:
            if not self.manual_silence_timed_out_locked():
                return False
            self.clear_manual_locked("Manual override cleared after silence")
            return True

    def manual_control(self, payload):
        action = payload.get("action", "select")

        if action == "clear":
            with self.lock:
                self.clear_manual_locked()
                return {"manualQueue": [], "manualIndex": -1, "manualMode": False}

        if action == "set":
            specs = payload.get("tracks") or []
            default_artist = (payload.get("artist") or "").strip()
            default_album = (payload.get("album") or "").strip()
            default_released = (payload.get("released") or "").strip()
            queue = [
                track
                for index, spec in enumerate(specs)
                if (track := manual_track_from_spec(spec, index, default_artist, default_album, default_released))
            ]
            selected_index = int(payload.get("index", 0) or 0)
            with self.lock:
                self.state.manualQueue = queue
                if not queue:
                    self.state.manualIndex = -1
                    self.state.manualMode = False
                    self.manual_started_at = None
                    self.state.status = "no_match"
                    self.state.message = "No manual tracks entered"
                    self.write_state_locked()
                    return self.state.as_dict()
                self.set_manual_track_locked(max(0, min(selected_index, len(queue) - 1)))
                return self.state.as_dict()

        with self.lock:
            if not self.state.manualQueue:
                return self.state.as_dict()
            if action == "next":
                index = min(len(self.state.manualQueue) - 1, self.state.manualIndex + 1)
            elif action == "previous":
                index = max(0, self.state.manualIndex - 1)
            else:
                index = int(payload.get("index", self.state.manualIndex) or 0)
                index = max(0, min(index, len(self.state.manualQueue) - 1))
            self.set_manual_track_locked(index)
            return self.state.as_dict()

    def advance_manual_if_needed(self):
        with self.lock:
            if self.manual_silence_timed_out_locked():
                self.clear_manual_locked("Manual override cleared after silence")
                return
            if not self.state.manualMode or self.state.manualIndex >= len(self.state.manualQueue) - 1:
                return
            track = self.state.current
            end = synced_lyrics_end(track.get("lyrics") if track else None)
            position = playback_position(track, self.state.lyricOffsetSeconds)
            if end is None or position is None or position < end + 4:
                return
            self.set_manual_track_locked(self.state.manualIndex + 1)

    def update_settings(self, default_lyric_offset=None, meter_display_mode=None):
        with self.lock:
            if default_lyric_offset is not None:
                value = max(-30.0, min(60.0, float(default_lyric_offset)))
                self.state.config["defaultLyricOffsetSeconds"] = value
                self.state.lyricOffsetSeconds = value
                self.settings["defaultLyricOffsetSeconds"] = value
            if meter_display_mode in ("vu", "spectrum"):
                self.state.config["meterDisplayMode"] = meter_display_mode
                self.settings["meterDisplayMode"] = meter_display_mode
            save_settings(self.settings)
            self.write_state_locked()
            return {
                "defaultLyricOffsetSeconds": self.state.config["defaultLyricOffsetSeconds"],
                "meterDisplayMode": self.state.config["meterDisplayMode"],
            }

    def is_music_active(self):
        with self.lock:
            return bool(
                self.music_active_since
                and time.time() - self.music_active_since >= self.args.music_start_seconds
            )

    def update_music_activity(self, levels):
        rms = levels.get("rmsDb")
        if not isinstance(rms, (int, float)):
            return

        now = time.time()
        with self.lock:
            if rms >= self.args.silence_threshold:
                self.last_loud_at = now
                self.track_gap_cleared = False
                if self.music_active_since is None:
                    self.music_active_since = now
                return

            silence_seconds = self.silence_seconds_locked(now)
            if (
                silence_seconds is not None
                and self.args.track_gap_silence_seconds > 0
                and silence_seconds >= self.args.track_gap_silence_seconds
                and not self.track_gap_cleared
            ):
                self.clear_now_playing_for_track_gap_locked()
                self.track_gap_cleared = True
                log_event("audio", action="silence_detected", seconds=round(silence_seconds, 2))

            if self.last_loud_at is None or now - self.last_loud_at > self.args.silence_hold_seconds:
                self.music_active_since = None
                if self.manual_silence_timed_out_locked(now):
                    self.clear_manual_locked("Manual override cleared after silence")
                self.clear_now_playing_after_silence_if_needed_locked(now)

    def capture(self, seconds):
        sample_path = ROOT / "captures" / f"dashboard-{int(time.time())}-{seconds}s.wav"
        command = capture_command(self.args, sample_path, seconds)
        log_event("capture", action="start", seconds=seconds, path=str(sample_path.relative_to(ROOT)))
        with self.audio_lock:
            result = run_command(command, timeout=seconds + 20)
        if result.returncode != 0:
            log_event("capture", action="failed", code=result.returncode)
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
        levels = parse_level(result.stdout + result.stderr)
        log_event(
            "capture",
            action="done",
            seconds=seconds,
            rms=levels.get("rmsDb"),
            peak=levels.get("peakDb"),
        )
        return sample_path, levels

    def identify(self, sample_path):
        command = [sys.executable, "tools/identify_shazam.py", str(sample_path), "--json"]
        log_event("shazam", action="start", sample=str(sample_path.relative_to(ROOT)))
        result = run_command(command, timeout=45, low_priority=True)
        if result.returncode != 0:
            log_event("shazam", action="failed", code=result.returncode)
            raise RuntimeError(result.stderr.strip() or result.stdout.strip())
        track = track_from_shazam(json.loads(result.stdout))
        if track:
            log_event("shazam", action="matched", artist=track.get("artist"), title=track.get("title"))
            try:
                track["lyrics"] = lookup_lyrics(track)
            except Exception as exc:
                track["lyrics"] = None
                track["lyricsError"] = str(exc)
                log_event("lyrics", result="error", error=str(exc))
        else:
            log_event("shazam", action="no_match")
        return track

    def scan_once(self, manual=False):
        if not self.scanning.acquire(blocking=False):
            return

        try:
            with self.lock:
                manual_mode = self.state.manualMode
            if not manual and manual_mode:
                self.advance_manual_if_needed()
                self.update(status="manual", message="Manual override active", nextScanAt=None, error=None)
                return

            if not manual and not self.is_music_active():
                self.update(
                    status="idle",
                    message=self.idle_message(),
                    nextScanAt=None,
                    error=None,
                )
                return

            started_at = utc_now()
            log_event("scan", action="start", manual=manual, primary_seconds=self.args.primary_seconds)
            self.update(
                status="listening",
                message=f"Capturing a {self.args.primary_seconds} second sample",
                error=None,
                nextScanAt=None,
            )

            sample_path, levels = self.capture(self.args.primary_seconds)
            self.update(status="identifying", message="Identifying the sample")
            track = self.identify(sample_path)
            used_seconds = self.args.primary_seconds

            if not track and self.args.fallback_seconds > self.args.primary_seconds:
                self.update(
                    status="listening",
                    message=f"No match yet, trying a {self.args.fallback_seconds} second fallback",
                )
                sample_path, levels = self.capture(self.args.fallback_seconds)
                self.update(status="identifying", message="Identifying the fallback sample")
                track = self.identify(sample_path)
                used_seconds = self.args.fallback_seconds

            scan = {
                "startedAt": started_at,
                "finishedAt": utc_now(),
                "manual": manual,
                "sampleSeconds": used_seconds,
                "samplePath": str(sample_path.relative_to(ROOT)),
                "levels": levels,
                "matched": bool(track),
            }

            with self.lock:
                self.state.lastScan = scan
                if track:
                    changed = not same_track(self.state.current, track)
                    if changed:
                        self.state.previous = self.state.current
                        self.state.current = track
                        self.state.history.append(track)
                        self.state.lyricOffsetSeconds = self.state.config["defaultLyricOffsetSeconds"]
                        self.state.lyricScroll = 0
                    self.state.status = "matched"
                    self.state.message = "Updated now playing" if changed else "Same track still playing"
                    log_event(
                        "scan",
                        action="done",
                        result="matched",
                        changed=changed,
                        sample_seconds=used_seconds,
                    )
                else:
                    self.state.status = "no_match"
                    self.state.message = "No match from the latest sample"
                    log_event("scan", action="done", result="no_match", sample_seconds=used_seconds)
                self.state.error = None
                self.write_state_locked()
        except Exception as exc:
            self.update(status="error", message="Recognition failed", error=str(exc))
            log_event("scan", action="error", error=str(exc))
        finally:
            self.scanning.release()

    def loop(self):
        while not self.stop_requested.is_set():
            if not self.is_music_active():
                with self.lock:
                    manual_mode = self.state.manualMode
                if not manual_mode:
                    self.update(status="idle", message=self.idle_message(), nextScanAt=None, error=None)
                while not self.stop_requested.is_set() and not self.is_music_active():
                    self.advance_manual_if_needed()
                    with self.lock:
                        self.clear_now_playing_after_silence_if_needed_locked()
                    if self.scan_requested.wait(timeout=1):
                        self.scan_requested.clear()
                        self.scan_once(manual=True)
                        break
                if self.stop_requested.is_set():
                    break

            self.advance_manual_if_needed()

            if self.is_music_active():
                self.scan_once()
                next_scan = time.time() + self.args.interval
                self.update(nextScanAt=datetime.fromtimestamp(next_scan, timezone.utc).isoformat())
                while time.time() < next_scan and not self.stop_requested.is_set():
                    if self.scan_requested.wait(timeout=1):
                        self.scan_requested.clear()
                        self.scan_once(manual=True)
                        next_scan = time.time() + self.args.interval
                        self.update(nextScanAt=datetime.fromtimestamp(next_scan, timezone.utc).isoformat())
                    self.advance_manual_if_needed()
                    with self.lock:
                        self.clear_now_playing_after_silence_if_needed_locked()
                    if not self.is_music_active():
                        with self.lock:
                            manual_mode = self.state.manualMode
                        if not manual_mode:
                            self.update(status="idle", message=self.idle_message(), nextScanAt=None)
                        break
                self.scan_requested.clear()

    def level_loop(self):
        while not self.stop_requested.is_set():
            command = meter_command(self.args)
            try:
                with self.audio_lock:
                    self.level_process = subprocess.Popen(
                        command,
                        cwd=ROOT,
                        text=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.DEVNULL,
                        bufsize=1,
                    )

                for line in self.level_process.stdout:
                    if self.stop_requested.is_set():
                        break
                    try:
                        levels = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    levels["updatedAt"] = utc_now()
                    self.update_music_activity(levels)
                    self.update(level=levels)
                self.level_process.wait(timeout=2)
            except Exception as exc:
                self.update(error=f"VU meter failed: {exc}")
                self.stop_requested.wait(2)
            finally:
                if self.level_process and self.level_process.poll() is None:
                    self.level_process.terminate()
                self.level_process = None


class Handler(SimpleHTTPRequestHandler):
    service: NowPlayingService = None

    def translate_path(self, path):
        parsed = urlparse(path)
        if parsed.path == "/":
            return str(WEB_ROOT / "index.html")
        if parsed.path == "/control":
            return str(WEB_ROOT / "control.html")
        return str(WEB_ROOT / parsed.path.lstrip("/"))

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            self.send_json(self.service.snapshot())
            return
        if parsed.path == "/api/level":
            self.send_json(self.service.level_snapshot())
            return
        if parsed.path == "/api/settings":
            self.send_json(self.service.settings_snapshot())
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/scan":
            self.service.request_scan()
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/lyrics/adjust":
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length).decode("utf-8") if length else "{}"
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = {}
            result = self.service.adjust_lyrics(
                offset_delta=float(payload.get("offsetDelta", 0) or 0),
                scroll_delta=int(payload.get("scrollDelta", 0) or 0),
                reset_scroll=bool(payload.get("resetScroll", False)),
                reset_offset=bool(payload.get("resetOffset", False)),
            )
            self.send_json({"ok": True, **result})
            return
        if parsed.path == "/api/manual":
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length).decode("utf-8") if length else "{}"
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = {}
            result = self.service.manual_control(payload)
            self.send_json({"ok": True, **result})
            return
        if parsed.path == "/api/settings":
            length = int(self.headers.get("Content-Length", "0") or "0")
            body = self.rfile.read(length).decode("utf-8") if length else "{}"
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = {}
            result = self.service.update_settings(
                default_lyric_offset=payload.get("defaultLyricOffsetSeconds"),
                meter_display_mode=payload.get("meterDisplayMode"),
            )
            self.send_json({"ok": True, **result})
            return
        self.send_json({"error": "not found"}, status=404)

    def log_message(self, format, *args):
        if self.path.startswith("/api/level"):
            return
        print(f"[http] {self.address_string()} {format % args}")


def main():
    parser = argparse.ArgumentParser(description="Run the vinyl now playing dashboard.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--device", default="USB PnP Audio Device")
    parser.add_argument("--audio-backend", choices=["auto", "coreaudio", "alsa"], default="auto")
    parser.add_argument("--alsa-device", default="")
    parser.add_argument("--alsa-rate", type=int, default=44100)
    parser.add_argument("--alsa-channels", type=int, default=2)
    parser.add_argument("--interval", type=int, default=15)
    parser.add_argument("--primary-seconds", type=int, default=8)
    parser.add_argument("--fallback-seconds", type=int, default=15)
    parser.add_argument("--level-window", type=float, default=0.033)
    parser.add_argument("--silence-threshold", type=float, default=-55.0)
    parser.add_argument("--music-start-seconds", type=float, default=1.5)
    parser.add_argument("--track-gap-silence-seconds", type=float, default=2.0)
    parser.add_argument("--clear-on-track-gap", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--silence-hold-seconds", type=float, default=2.0)
    parser.add_argument("--manual-clear-silence-seconds", type=float, default=75.0)
    parser.add_argument("--now-playing-clear-silence-seconds", type=float, default=120.0)
    parser.add_argument("--lyric-default-offset", type=float, default=11.0)
    args = parser.parse_args()
    args.resolved_audio_backend = resolve_audio_backend(args)

    service = NowPlayingService(args)
    Handler.service = service

    worker = threading.Thread(target=service.loop, daemon=True)
    worker.start()
    level_worker = threading.Thread(target=service.level_loop, daemon=True)
    level_worker.start()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Now Playing dashboard: http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        service.stop_requested.set()
        if service.level_process and service.level_process.poll() is None:
            service.level_process.terminate()
        server.server_close()


if __name__ == "__main__":
    main()
