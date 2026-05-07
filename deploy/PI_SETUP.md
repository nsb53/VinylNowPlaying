# Raspberry Pi Deployment

These steps assume Raspberry Pi OS with Desktop, a USB audio input, and Chromium on the Pi.

## 1. Copy the project

On the Pi:

```sh
cd /home/pi
git clone <your-repo-url> VinylNowPlaying
cd VinylNowPlaying
```

Or copy this folder to `/home/pi/VinylNowPlaying` with `scp`/Finder.

## 2. Install system packages

```sh
sudo apt update
sudo apt install -y python3-venv python3-pip alsa-utils chromium-browser xserver-xorg xinit openbox dbus-x11 unclutter python3-xdg
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

## 3. Find the USB input

Plug in the USB audio device and run:

```sh
arecord -l
arecord -L
```

Look for the capture card. Common device names are:

```text
dsnoop:CARD=Device,DEV=0
plughw:CARD=Device,DEV=0
hw:1,0
default
```

Prefer `dsnoop:CARD=Device,DEV=0` when it is available. It lets the live VU meter and the recognition recorder read the USB input at the same time, avoiding `audio open error: Device or resource busy`.

Test a 5-second recording:

```sh
mkdir -p captures
arecord -D dsnoop:CARD=Device,DEV=0 -f S16_LE -c 2 -r 48000 -d 5 -t wav captures/pi-test.wav
aplay captures/pi-test.wav
```

If that fails, try the other device name from `arecord -L`.

## 4. Test the dashboard manually

```sh
.venv/bin/python tools/now_playing_server.py --host 0.0.0.0 --audio-backend alsa --alsa-device dsnoop:CARD=Device,DEV=0 --alsa-rate 48000 --level-window 0.25
```

Open on the Pi:

```text
http://127.0.0.1:8765
```

Open from your phone or Mac on the same Wi-Fi:

```text
http://<pi-ip-address>:8765/control
```

Find the Pi IP with:

```sh
hostname -I
```

## 5. Install the dashboard service

Edit `deploy/vinyl-now-playing.service` if your project path, username, or ALSA device differs.

```sh
sudo cp deploy/vinyl-now-playing.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vinyl-now-playing.service
systemctl status vinyl-now-playing.service
```

Logs:

```sh
journalctl -u vinyl-now-playing.service -f
```

## 6. Start Chromium at boot

Raspberry Pi OS Bookworm and newer use Wayland/labwc by default. The included
`vinyl-kiosk.service` is the simple X11 kiosk path, so use X11 for the first
deployment unless you want to wire up a Wayland/labwc autostart later.

```sh
sudo raspi-config
```

Choose `6 Advanced Options` -> `A7 Wayland` -> `W1 X11`, then reboot when prompted.

Then make sure the Pi boots to desktop:

```sh
sudo raspi-config
```

Choose `System Options` -> `Boot / Auto Login` -> desktop autologin.

For a headless/minimal image, allow Xorg to start from the kiosk service:

```sh
sudo tee /etc/X11/Xwrapper.config >/dev/null <<'EOF'
allowed_users=anybody
needs_root_rights=yes
EOF
chmod +x deploy/start-kiosk.sh deploy/vinyl-kiosk-openvt.sh
```

Then install the kiosk service:

```sh
sudo cp deploy/vinyl-kiosk.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vinyl-kiosk.service
```

If Chromium does not start, check:

```sh
journalctl -u vinyl-kiosk.service -f
```

## 7. Useful tuning

If the USB input is mono or a different format, try:

```sh
.venv/bin/python tools/now_playing_server.py --audio-backend alsa --alsa-device dsnoop:CARD=Device,DEV=0 --alsa-rate 48000 --level-window 0.25 --alsa-channels 1
```

If music detection is too sensitive or not sensitive enough:

```sh
--silence-threshold -55
```

Less negative means stricter, more negative means more sensitive.

If track changes are not being caught quickly enough, tune the gap and scan
timing:

```sh
--track-gap-silence-seconds 2 --interval 15 --primary-seconds 8 --fallback-seconds 15
```

Use `--no-clear-on-track-gap` if you want to keep the current track visible
during quiet gaps between songs.

By default, the current artwork/match/lyrics clear after 120 seconds of silence:

```sh
--now-playing-clear-silence-seconds 120
```
