#!/bin/sh
rm -f /tmp/vinyl-kiosk.log
exec /usr/bin/openvt -c 1 -f -s -w -- /bin/sh -lc 'exec /usr/sbin/runuser -u pi -- /usr/bin/xinit /home/pi/VinylNowPlaying/deploy/start-kiosk.sh -- :0 vt1 -nolisten tcp -nocursor > /tmp/vinyl-kiosk.log 2>&1'
