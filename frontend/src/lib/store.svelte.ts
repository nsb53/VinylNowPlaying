// Everything the themes show: track, lyrics, trivia, cover and the chosen theme.
// Themes only read from here, so a new theme is a layout file and nothing else.

import { vu } from './vu';

export type Theme = 'mcm' | 'mcm-night' | 'sunset' | 'sleeve';
const THEMES: Theme[] = ['mcm', 'mcm-night', 'sunset', 'sleeve'];

type TriviaItem = {
  question?: string;
  topic?: string;
  choices?: string[];
  correctIndex?: number;
  answer?: string;
};

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
  lyrics?: { plain?: string; synced?: string; instrumental?: boolean; duration?: number };
  songInfo?: {
    originalRelease?: string;
    originalReleaseDate?: string;
    genre?: string;
    writtenBy?: string[];
    trivia?: TriviaItem[];
  };
};

const STATE_POLL_MS = 3000;
const TICK_MS = 250;
const TRIVIA_QUESTION_MS = 20000;
const TRIVIA_ANSWER_MS = 10000;
const ART_ROTATE_MS = 8000;

// ?theme=sleeve in the address pins a theme for that screen (useful for previews).
const pinned = new URLSearchParams(location.search).get('theme') as Theme | null;
const pinnedTheme = pinned && THEMES.includes(pinned) ? pinned : null;

export const app = $state({
  theme: (pinnedTheme ?? 'mcm') as Theme,
  track: null as Track | null,
  message: 'Connecting',
  error: null as string | null,
  lyricOffset: 0,
  lyricScroll: 0,
  now: Date.now(),
  trackSince: Date.now(),
  trivia: { index: 0, revealed: false, since: Date.now() },
});

let trackId: string | null = null;

function setTheme(value: unknown) {
  if (!pinnedTheme && THEMES.includes(value as Theme)) app.theme = value as Theme;
}

function applyState(data: any) {
  const track: Track | null = data.current ?? null;
  const id = track ? track.id || `${track.artist || ''}:${track.title || ''}` : null;
  if (id !== trackId) {
    trackId = id;
    app.trackSince = Date.now();
    app.trivia = { index: 0, revealed: false, since: Date.now() };
  }
  app.track = track;
  app.message = data.message || data.status || 'Listening';
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
  const items = app.track?.songInfo?.trivia ?? [];
  if (!items.length) return;
  const trivia = app.trivia;
  if (trivia.index >= items.length) trivia.index = 0;
  if (app.now - trivia.since < (trivia.revealed ? TRIVIA_ANSWER_MS : TRIVIA_QUESTION_MS)) return;
  if (trivia.revealed) trivia.index = (trivia.index + 1) % items.length;
  trivia.revealed = !trivia.revealed;
  trivia.since = app.now;
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
    return { playing: true, title: track.title || 'Unknown Title', artist: track.artist || 'Unknown Artist' };
  }
  return { playing: false, title: 'Listening…', artist: app.error || app.message };
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

export function triviaView() {
  const items = app.track?.songInfo?.trivia ?? [];
  const item = items[app.trivia.index];
  if (!item) return null;
  return {
    topic: (item.topic || 'trivia').toUpperCase(),
    question: item.question || '',
    choices: (item.choices ?? []).map((text, index) => ({
      letter: 'ABCD'[index] || '',
      text,
      correct: index === item.correctIndex,
    })),
    answer: item.answer || '',
    revealed: app.trivia.revealed,
    counter: `${app.trivia.index + 1} / ${items.length}`,
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
