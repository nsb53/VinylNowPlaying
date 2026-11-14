#!/bin/sh
# Run on the Mac: brings the Pi up to date with GitHub and restarts the app.
#
#   deploy/update-pi.sh
#
# The Pi downloads the latest merged code (branch my-changes), installs any new
# Python libraries, and restarts. Uncommitted work on the Mac is NOT sent; merge
# it on GitHub first. Override the defaults with PI_HOST, PI_KEY or PI_BRANCH.
set -e

HOST="${PI_HOST:-pi-master@pi5.local}"
KEY="${PI_KEY:-$HOME/.ssh/id_ed25519_pi5}"
BRANCH="${PI_BRANCH:-my-changes}"

ssh -i "$KEY" -o BatchMode=yes "$HOST" BRANCH="$BRANCH" sh -s <<'EOF'
set -e
cd ~/VinylNowPlaying

# Edits made directly on the Pi would block the update; GitHub is the source of truth.
if ! git diff --quiet; then
  echo "Discarding edits made on the Pi:"
  git diff --stat
  git checkout -- .
fi

before=$(git rev-parse --short HEAD)
git fetch -q origin "$BRANCH"
git checkout -q "$BRANCH"
git merge -q --ff-only "origin/$BRANCH"
after=$(git rev-parse --short HEAD)
if [ "$before" = "$after" ]; then
  echo "Already up to date ($after)."
else
  echo "Updated $before -> $after:"
  git log --oneline "$before..$after"
fi

.venv/bin/pip install -q -r requirements.txt

# The service restarts the app by itself a few seconds after it stops.
pkill -f "^$HOME/VinylNowPlaying/.venv/bin/python tools/now_playing_server.py" || true
for i in $(seq 1 30); do
  sleep 1
  if curl -s -o /dev/null http://127.0.0.1:8765/; then
    echo "App restarted and running."
    exit 0
  fi
done
echo "App did not come back within 30 seconds. Check: journalctl -u vinyl-now-playing -n 50"
exit 1
EOF
