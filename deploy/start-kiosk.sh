#!/bin/sh
xset -dpms
xset s off
xset s noblank
openbox-session &
unclutter -idle 0.5 -root &
exec /usr/lib/chromium/chromium \
  --kiosk \
  --user-data-dir=/home/pi/.config/vinyl-chromium \
  --no-first-run \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --disable-renderer-accessibility \
  --disable-background-networking \
  --disable-component-update \
  --disable-sync \
  --disable-extensions \
  --disable-gpu \
  --disable-gpu-compositing \
  --disable-crash-reporter \
  --disable-breakpad \
  --disable-notifications \
  --disable-print-preview \
  --process-per-site \
  --autoplay-policy=no-user-gesture-required \
  http://127.0.0.1:8765
