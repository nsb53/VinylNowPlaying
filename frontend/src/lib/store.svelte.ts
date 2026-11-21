// Everything the themes show: track, lyrics, facts, cover and the chosen theme.
// Themes only read from here, so a new theme is a layout file and nothing else.

import { vu } from './vu';
import THEME_LIST from '../../../web/themes.json';

export type Theme = string;
// The full list, shared with the server and the control page.
const THEMES: Theme[] = THEME_LIST.map((theme) => theme.id);

type Fact = { category?: string; text?: string };

/** Colours from the album cover, as #rrggbb. Made on the server (tools/album_style.py). */
export type Palette = {
  dark: boolean;
  bg: string;
  ink: string;
  muted: string;
  current: string;
  titleBg: string;
  titleInk: string;
  meterBg: string;
  cardBg: string;
  cardInk: string;
  cardTag: string;
  burstA: string;
  burstB: string;
  face: string;
  faceInk: string;
  vuRed: string;
};
export type AlbumStyle = { font?: string; motif?: string };
type AlbumLook = { palette?: Palette | null; style?: AlbumStyle | null };

type Track = {
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  released?: string;
  genre?: string;
  cover?: string;
  artistImage?: string;
  recognizedAt?: string;
  recognizedOffset?: number;
  lyricsError?: string;
  albumStyle?: AlbumLook;
  lyrics?: { plain?: string; synced?: string; instrumental?: boolean; duration?: number };
  songInfo?: {
    originalRelease?: string;
    originalReleaseDate?: string;
    genre?: string;
    writtenBy?: string[];
    facts?: Fact[];
  };
};

const STATE_POLL_MS = 3000;
const TICK_MS = 250;
const FACT_MS = 15000;
const ART_ROTATE_MS = 8000;

// ?theme=sleeve in the address pins a theme for that screen (useful for previews).
const pinned = new URLSearchParams(location.search).get('theme') as Theme | null;
const pinnedTheme = pinned && THEMES.includes(pinned) ? pinned : null;

export const app = $state({
  theme: (pinnedTheme ?? 'mcm') as Theme,
  track: null as Track | null,
  message: 'Connecting',
  status: '',
  error: null as string | null,
  lyricOffset: 0,
  lyricScroll: 0,
  now: Date.now(),
  trackSince: Date.now(),
  fact: { index: 0, since: Date.now() },
  // The last album's look. Kept while nothing is playing, so the screen stays
  // steady between songs and sides.
  look: { palette: null, style: null } as AlbumLook,
});

let trackId: string | null = null;
let build: string | null = null;

function setTheme(value: unknown) {
  if (!pinnedTheme && THEMES.includes(value as Theme)) app.theme = value as Theme;
}

function applyState(data: any) {
  // The app was updated since this screen loaded: reload to get the new themes.
  if (data.build) {
    if (build && data.build !== build) location.reload();
    build = data.build;
  }
  const track: Track | null = data.current ?? null;
  const id = track ? track.id || `${track.artist || ''}:${track.title || ''}` : null;
  if (id !== trackId) {
    trackId = id;
    app.trackSince = Date.now();
    app.fact = { index: 0, since: Date.now() };
  }
  app.track = track;
  const look = track?.albumStyle;
  if (look && JSON.stringify(look) !== JSON.stringify(app.look)) app.look = look;
  app.message = data.message || data.status || 'Listening';
  app.status = data.status || '';
  app.error = data.error || null;
  app.lyricOffset = Number(data.lyricOffsetSeconds) || 0;
  app.lyricScroll = Math.round(Number(data.lyricScroll) || 0);
  setTheme(data.config?.displayTheme);
  const silence = Number(data.config?.silenceThresholdDb);
  if (Number.isFinite(silence)) vu.silence = silence;
}

/** Server clock minus this screen's clock, in ms. TV clocks are often wrong. */
let clockSkew = 0;

async function refreshState() {
  try {
    const sent = Date.now();
    const response = await fetch('/api/state', { cache: 'no-store' });
    const data = await response.json();
    const received = Date.now();
    const serverTime = new Date(data.serverTime).getTime();
    // Skip slow round trips: the estimate is only as good as the delay is short.
    if (Number.isFinite(serverTime) && received - sent < 500) {
      clockSkew = serverTime - (sent + received) / 2;
    }
    applyState(data);
  } catch {
    app.message = 'Reconnecting';
  }
}

function pushLevel(level: any) {
  const left = Number(level?.leftRmsDb ?? level?.rmsDb);
  const right = Number(level?.rightRmsDb ?? level?.rmsDb);
  vu.push(Number.isFinite(left) ? left : -120, Number.isFinite(right) ? right : -120);
}

function tick() {
  app.now = Date.now();
  const items = app.track?.songInfo?.facts ?? [];
  if (!items.length) return;
  const fact = app.fact;
  if (fact.index >= items.length) fact.index = 0;
  if (app.now - fact.since < FACT_MS) return;
  fact.index = (fact.index + 1) % items.length;
  fact.since = app.now;
}

/** Starts polling and the live level stream. Returns a stop function. */
export function start() {
  refreshState();
  const stateTimer = setInterval(refreshState, STATE_POLL_MS);
  const tickTimer = setInterval(tick, TICK_MS);

  // Levels and theme changes are pushed by the server about 30 times a second.
  let lastStreamAt = 0;
  let stream: EventSource | null = null;
  if ('EventSource' in window) {
    stream = new EventSource('/api/stream');
    stream.onmessage = (event) => {
      lastStreamAt = Date.now();
      pushLevel(JSON.parse(event.data));
    };
    stream.addEventListener('theme', (event) => setTheme(JSON.parse((event as MessageEvent).data)));
  }

  // If the stream is unavailable or stalls, fall back to asking for levels.
  let polling = false;
  const levelTimer = setInterval(async () => {
    if (polling || Date.now() - lastStreamAt < 2000) return;
    polling = true;
    try {
      const response = await fetch('/api/level', { cache: 'no-store' });
      pushLevel(await response.json());
    } catch {
      // The state poll reports the lost connection.
    }
    polling = false;
  }, 120);

  return () => {
    clearInterval(stateTimer);
    clearInterval(tickTimer);
    clearInterval(levelTimer);
    stream?.close();
  };
}

// ---------- views ----------

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function headline() {
  const track = app.track;
  if (track) {
    return { playing: true, stopped: false, title: track.title || 'Unknown Title', artist: track.artist || 'Unknown Artist' };
  }
  // Stopped from the control page: say so rather than "Listening".
  if (app.status === 'stopped') return { playing: false, stopped: true, title: 'Stopped', artist: 'Press Start on the control page' };
  return { playing: false, stopped: false, title: 'Listening…', artist: app.error || app.message };
}

export function credits() {
  const track = app.track;
  const info = track?.songInfo;
  const release = [
    info?.originalRelease || track?.album,
    info?.originalReleaseDate || track?.released,
    info?.genre || track?.genre,
  ].filter(Boolean);
  const writers = (info?.writtenBy ?? []).filter(Boolean);
  return {
    release: release.join(' · '),
    writers: writers.length ? `Written by ${writers.join(', ')}` : '',
  };
}

export function coverView() {
  const track = app.track;
  const images = [track?.cover, track?.artistImage].filter(
    (url, index, list): url is string => !!url && list.indexOf(url) === index,
  );
  if (!track || !images.length) return null;
  const index = Math.floor((app.now - app.trackSince) / ART_ROTATE_MS) % images.length;
  return {
    url: images[index],
    alt: images[index] === track.cover ? `${track.title || 'Album'} cover` : `${track.artist || 'Artist'} photo`,
  };
}

/** The "Did you know" card: one fact at a time, rotating. Null when there are none. */
export function factView() {
  const items = (app.track?.songInfo?.facts ?? []).filter((item) => item.text);
  const item = items[app.fact.index] ?? items[0];
  if (!item) return null;
  return {
    category: (item.category || 'Did you know').toUpperCase(),
    text: item.text || '',
    counter: items.length > 1 ? `${Math.min(app.fact.index, items.length - 1) + 1} / ${items.length}` : '',
    index: app.fact.index,
  };
}

type LyricLine = { text: string; active: boolean };
export type LyricView = { label: string; lines: LyricLine[]; note: string };

let parsedKey = '';
let parsedLines: { time: number; text: string }[] = [];

function syncedLines(track: Track) {
  const synced = track.lyrics?.synced || '';
  const key = `${track.id || ''}:${synced.length}`;
  if (key !== parsedKey) {
    parsedKey = key;
    parsedLines = [];
    for (const line of synced.split('\n')) {
      const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/);
      if (match && match[3].trim()) {
        parsedLines.push({ time: Number(match[1]) * 60 + Number(match[2]), text: match[3].trim() });
      }
    }
  }
  return parsedLines;
}

function playbackPosition(track: Track) {
  if (!track.recognizedAt || !Number.isFinite(track.recognizedOffset)) return null;
  const elapsed = (app.now + clockSkew - new Date(track.recognizedAt).getTime()) / 1000;
  return (track.recognizedOffset as number) + elapsed + app.lyricOffset;
}

function windowOf(texts: string[], centre: number, before: number, after: number, highlight: boolean) {
  const lines: LyricLine[] = [];
  for (let index = centre - before; index <= centre + after; index += 1) {
    lines.push({ text: texts[index] ?? '', active: highlight && index === centre });
  }
  return lines;
}

/** The lyric lines to show: `before` lines above the current one and `after` below. */
export function lyricView(before: number, after: number): LyricView {
  const track = app.track;
  if (!track) return { label: 'WAITING', lines: [], note: 'Lyrics appear here when a song is recognised.' };
  const lyrics = track.lyrics;
  if (lyrics?.instrumental) return { label: 'INSTRUMENTAL', lines: [], note: 'Instrumental' };

  if (lyrics?.plain) {
    const position = playbackPosition(track);
    const synced = lyrics.synced ? syncedLines(track) : [];
    if (synced.length && position !== null) {
      let active = 0;
      for (let index = 0; index < synced.length; index += 1) {
        if (synced[index].time <= position) active = index;
      }
      return { label: 'SYNCED', lines: windowOf(synced.map((l) => l.text), active, before, after, true), note: '' };
    }

    // Unsynced lyrics: estimate the place in the song from elapsed time.
    const plain = lyrics.plain.split('\n').map((line) => line.trim()).filter(Boolean);
    const duration = Number(lyrics.duration);
    let centre = before;
    if (position !== null && duration > 0) {
      const progress = clamp((position / duration - 0.04) / 0.72, 0, 1);
      centre = Math.round(progress * (plain.length - 1));
    }
    centre = clamp(centre + app.lyricScroll, 0, Math.max(0, plain.length - 1));
    return { label: 'UNSYNCED', lines: windowOf(plain, centre, before, after, false), note: '' };
  }

  return {
    label: track.lyricsError ? 'ERROR' : 'NO LYRICS',
    lines: [],
    note: track.lyricsError || 'No lyrics found for this track.',
  };
}
