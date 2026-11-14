# Raspberry Pi

The Pi runs the app with no screen or keyboard of its own. It listens to the
ClearClick USB audio adapter, and the TV and phones open its pages over Wi-Fi:

- TV display: `http://192.168.1.227:8765` (or `http://pi5.local:8765`)
- Control page: `http://192.168.1.227:8765/control`

## Updating the Pi

Merge the change on GitHub (branch `my-changes`), then on the Mac run:

```sh
deploy/update-pi.sh
```

It downloads the latest code on the Pi, installs any new Python libraries and
restarts the app. Work that is not merged yet is not sent. Edits made directly
on the Pi are thrown away, so make changes on the Mac.

## Everyday commands

Log in to the Pi from the Mac (no password; uses the key):

```sh
ssh -i ~/.ssh/id_ed25519_pi5 pi-master@pi5.local
```

On the Pi:

```sh
systemctl status vinyl-now-playing              # is it running?
journalctl -u vinyl-now-playing -n 100          # recent output
nano ~/VinylNowPlaying/pi.env                   # audio input name
sudo systemctl restart vinyl-now-playing        # restart (needs the password)
sudo poweroff                                   # shut down before unplugging
```

Without the password, stopping the app also restarts it, because the service
brings it back after five seconds:

```sh
pkill -f "^$HOME/VinylNowPlaying/.venv/bin/python tools/now_playing_server.py"
```

## Setting up a Pi from scratch

1. **Card.** With Raspberry Pi Imager on the Mac, write **Raspberry Pi OS Lite
   (64-bit)** to the microSD card. In its settings set the hostname (`pi5`),
   a user (`pi-master`) and password, the Wi-Fi network, the time zone, and
   turn on SSH.
2. **Key login.** Put the card in the Pi and power it on. After two minutes, on
   the Mac (asks for the Pi password once):

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_pi5 -N ""
   ssh-copy-id -i ~/.ssh/id_ed25519_pi5.pub pi-master@pi5.local
   ```

3. **Packages** (asks for the password):

   ```sh
   ssh -t -i ~/.ssh/id_ed25519_pi5 pi-master@pi5.local 'sudo apt-get update && sudo apt-get install -y git python3-venv python3-pip alsa-utils'
   ```

4. **App.** On the Pi:

   ```sh
   git clone https://github.com/nsb53/VinylNowPlaying.git ~/VinylNowPlaying
   cd ~/VinylNowPlaying
   python3 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```

5. **Gemini key.** From the Mac, copy only the Gemini line of `.env`:

   ```sh
   grep '^GEMINI' .env | ssh -i ~/.ssh/id_ed25519_pi5 pi-master@pi5.local 'umask 077; cat > ~/VinylNowPlaying/.env'
   ```

   Without it the app still runs, with no songwriters or "Did you know" facts.

6. **Audio input.** Plug in the ClearClick and list inputs with `arecord -L`.
   Use the `dsnoop:` name, which lets the level meter and the recorder share
   the input:

   ```sh
   echo 'ALSA_DEVICE=dsnoop:CARD=ClearClick,DEV=0' > ~/VinylNowPlaying/pi.env
   ```

7. **Start on boot** (asks for the password):

   ```sh
   sudo cp ~/VinylNowPlaying/deploy/vinyl-now-playing.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now vinyl-now-playing
   ```

## Tuning

Add options to the end of the `ExecStart` line in the service file, then copy
it again as in step 7 and run `sudo systemctl daemon-reload` and a restart.

- `--silence-threshold -55`: how loud counts as music. Less negative is
  stricter.
- `--track-gap-silence-seconds 2 --interval 15`: how quickly track changes
  are caught.
- `--now-playing-clear-silence-seconds 120`: how long the last song stays up
  after the music stops.
