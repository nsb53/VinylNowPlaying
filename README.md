# Vinyl Now Playing

Current app version: `0.5.8`

A local-first Now Playing dashboard for a vinyl/listening setup. It listens to a USB audio input, identifies the current track, shows album art, displays lyrics from LRCLIB, and renders live stereo-style VU meters plus a thin LED waveform. It is designed to run as a fullscreen kiosk on a Raspberry Pi, with Mac support for development and testing.

## Features

- Shazam-style track recognition with `shazamio`
- Album art and track metadata from the recognition result
- Song info metadata from Wikidata and MusicBrainz, with local caching
- Lyrics lookup from LRCLIB, including synced lyrics when available
- Phone-friendly control page for lyric offset, manual track override, and plain lyric scrolling
- Live VU meters and waveform from the capture input
- Toggleable real-time display modes: classic VU meters or FFT-based spectrum analyzer
- Automatic idle behavior: scans only when music is detected, clears Now Playing on short track gaps, and rescans when music resumes
- Raspberry Pi systemd services and Chromium kiosk setup
- Mac CoreAudio helper scripts for local development

## Project Layout

```text
web/       TV dashboard and phone control UI
tools/     Python server, recognition scripts, audio capture helpers
deploy/    Raspberry Pi systemd/kiosk templates and setup notes
state/     Runtime state, ignored by git
captures/  Temporary audio samples, ignored by git
```

## Requirements

### Shared

- Python 3.9+
- `shazamio` from `requirements.txt`

### Raspberry Pi

- Raspberry Pi OS or Debian-based Pi image
- USB audio capture device
- `alsa-utils`
- Chromium, X11, Openbox, and `unclutter` for kiosk mode

### Mac Development

- macOS with Swift available from Xcode command line tools
- A CoreAudio-compatible input device

## Quick Start: Mac Development

Create a virtual environment and install Python dependencies:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

List CoreAudio input devices:

```sh
swift -module-cache-path .swift-cache tools/audio_probe.swift
```

Run the dashboard using the default Mac/CoreAudio backend:

```sh
.venv/bin/python tools/now_playing_server.py
```

Open the TV dashboard:

```text
http://127.0.0.1:8765
```

Open the control page:

```text
http://127.0.0.1:8765/control
```

On iPhone, open `/control` in Safari and use Share -> Add to Home Screen.
The control page has its own web app manifest so the saved icon opens back to
`/control` instead of the TV dashboard.

If your input device is not named `USB PnP Audio Device`, pass a device name substring:

```sh
.venv/bin/python tools/now_playing_server.py --device "Your Input Device Name"
```

The default recognition loop is tuned for quicker record changes:

```text
8 second primary sample
15 second fallback sample
15 second active-music rescan interval
2 second track-gap silence detection
```

When the level stays below `--silence-threshold` for `--track-gap-silence-seconds`,
the top status changes to `Detected silence`, the current Now Playing display
clears, and the next music start triggers a fresh scan. Same-track scans do not
reset lyric timing.

## Quick Start: Raspberry Pi

See [deploy/PI_SETUP.md](deploy/PI_SETUP.md) for the full Pi setup, including package installs, ALSA testing, systemd services, and Chromium kiosk boot.

The current recommended ALSA command is:

```sh
.venv/bin/python tools/now_playing_server.py \
  --host 0.0.0.0 \
  --audio-backend alsa \
  --alsa-device dsnoop:CARD=Device,DEV=0 \
  --alsa-rate 48000 \
  --level-window 0.25
```

`dsnoop` is recommended because the live meter and recognition recorder both need to read the USB input. Direct `hw`/`plughw` devices may fail with `audio open error: Device or resource busy`.


## Audio Capture Notes

You will probably need to tweak the audio capture settings for your own hardware. The included Raspberry Pi service is configured for one tested USB capture device that appears as:

```text
dsnoop:CARD=Device,DEV=0
48000 Hz
2 channels
```

Other USB interfaces may use a different ALSA name, sample rate, or channel count. Start by running these on the Pi:

```sh
arecord -l
arecord -L
```

Then test a short recording with the device name that matches your hardware:

```sh
arecord -D dsnoop:CARD=Device,DEV=0 -f S16_LE -c 2 -r 48000 -d 5 -t wav captures/pi-test.wav
aplay captures/pi-test.wav
```

If your capture device is mono, uses 44100 Hz, or has a different ALSA name, update the `--alsa-device`, `--alsa-rate`, and `--alsa-channels` flags in your manual command or in `deploy/vinyl-now-playing.service`.

## Controls

The TV dashboard is intended to be passive. Use the control page from a phone or another browser:

```text
http://<pi-ip-address>:8765/control
```

The control page can:

- trigger a scan
- switch the TV display between VU meters and the FFT spectrum analyzer
- adjust lyric offset in 0.5 second steps
- save the default lyric offset
- scroll plain lyrics
- manually override artist/album/track when recognition is wrong or unavailable

## Recognition and Lyrics

The main recognition path uses `shazamio` and does not require an API key. LRCLIB lyric lookup also does not require an API key.

This project is intended for personal/local experimentation and is not affiliated with, endorsed by, or supported by Shazam or Apple. The `shazamio` recognition path is unofficial; if you need a supported commercial or production integration, use Apple's ShazamKit instead and review Apple's terms for your use case.

An older optional AcoustID helper remains in `tools/identify_acoustid.py` for experimentation. It requires `fpcalc` and an `ACOUSTID_API_KEY` environment variable, but it is not used by the dashboard server.

## Runtime Files

The app writes runtime state and temporary captures under:

```text
state/
captures/
```

These are ignored by git. Do not commit captured audio samples unless you intentionally add a small fixture and have the rights to share it.

## Notes

This project is tuned for a Raspberry Pi 3 class device, so the UI intentionally uses modest update rates. Faster Pis can support richer animation if desired.
