# Backlog

Ideas that are parked, not scheduled.

## Spectrum analyzer for the new display

A choice on the control page between VU meters and a spectrum analyzer, working in every theme.

- **Design:** 20 bands from 40 Hz to 16 kHz, stacked blocks of 2 dB, a dB scale and frequency labels,
  fast rise and slower fall, and peak markers that hold briefly before dropping. A sample is on the
  design canvas (board "Spectrum · analyzer in place of the VU meters").
- **Server:** `/api/stream` sends only left and right loudness today; it would need to send band levels too.
- **Mac:** the Mac audio meter does not calculate bands; only `tools/audio_meter_alsa.py` (the Pi) does.
- **Pi:** the existing bands are a plain average per band, which under-reads the bass; fix when building this.

## Lock or reroll an album's look (MCM - Dynamic)

Buttons on the control page for the album that is playing: keep its look for good, or ask for a new
one. The look is stored per album in `state/album-styles.json` (`palette` from the cover, `style`
from Gemini). A reroll would delete the `style` entry and ask Gemini again (one extra request); a
lock would add a flag that later lookups leave alone. Colours could also be rerolled by picking a
different set of accents from the cover.
