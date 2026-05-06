const els = {
  cover: document.querySelector("#cover"),
  recordFallback: document.querySelector("#recordFallback"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  title: document.querySelector("#title"),
  artist: document.querySelector("#artist"),
  album: document.querySelector("#album"),
  released: document.querySelector("#released"),
  lastScan: document.querySelector("#lastScan"),
  nextScan: document.querySelector("#nextScan"),
  history: document.querySelector("#history"),
  needleLeft: document.querySelector("#needleLeft"),
  needleRight: document.querySelector("#needleRight"),
  meterLeft: document.querySelector("#needleLeft")?.closest(".vu-meter"),
  meterRight: document.querySelector("#needleRight")?.closest(".vu-meter"),
  leftDb: document.querySelector("#leftDb"),
  rightDb: document.querySelector("#rightDb"),
  waveform: document.querySelector("#waveform"),
  lyricsMode: document.querySelector("#lyricsMode"),
  lyricsSource: document.querySelector("#lyricsSource"),
  lyricsText: document.querySelector("#lyricsText"),
};

const meterState = {
  leftTarget: -60,
  rightTarget: -60,
  leftDisplay: -60,
  rightDisplay: -60,
  lastFrame: performance.now(),
  lastPaint: 0,
};

const waveformState = {
  points: Array.from({ length: 120 }, () => 0),
  floor: -50,
  ceiling: -8,
  lastPaint: 0,
};

let latestState = null;
let lastSyncedActiveIndex = null;

function timeAgo(value) {
  if (!value) return "-";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timeUntil(value) {
  if (!value) return "-";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  if (seconds <= 0) return "soon";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function setCover(url) {
  if (url) {
    els.cover.src = url;
    els.cover.classList.remove("hidden");
    els.recordFallback.classList.add("hidden");
  } else {
    els.cover.removeAttribute("src");
    els.cover.classList.add("hidden");
    els.recordFallback.classList.remove("hidden");
  }
}

function renderHistory(history) {
  els.history.replaceChildren();
  [...history].reverse().slice(0, 2).forEach((track) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const artist = document.createElement("span");
    title.textContent = track.title || "Unknown Title";
    artist.textContent = track.artist || "Unknown Artist";
    item.append(title, artist);
    els.history.append(item);
  });
}

function parseSyncedLyrics(synced) {
  return (synced || "")
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/);
      if (!match) return null;
      return {
        time: Number(match[1]) * 60 + Number(match[2]),
        text: match[3] || "",
      };
    })
    .filter(Boolean);
}

function playbackPosition(track, lyricOffsetSeconds) {
  if (!track?.recognizedAt || !Number.isFinite(track.recognizedOffset)) return null;
  const elapsed = (Date.now() - new Date(track.recognizedAt).getTime()) / 1000;
  return track.recognizedOffset + elapsed + (lyricOffsetSeconds || 0);
}

function renderSyncedLyrics(track, lyrics, lyricOffsetSeconds) {
  const lines = parseSyncedLyrics(lyrics.synced).filter((line) => line.text.trim());
  const position = playbackPosition(track, lyricOffsetSeconds);
  if (!lines.length || position === null) return false;

  let activeIndex = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= position) activeIndex = index;
  }

  if (activeIndex === lastSyncedActiveIndex && els.lyricsText.classList.contains("synced")) {
    return true;
  }
  lastSyncedActiveIndex = activeIndex;

  els.lyricsText.className = "lyrics-text synced";
  els.lyricsText.replaceChildren();
  const start = Math.max(0, activeIndex - 5);
  lines.slice(start, activeIndex + 8).forEach((line, index) => {
    const row = document.createElement("p");
    const sourceIndex = start + index;
    row.textContent = line.text || " ";
    if (sourceIndex === activeIndex) row.className = "active";
    els.lyricsText.append(row);
  });
  return true;
}

function renderPlainLyrics(lyrics, lyricScroll) {
  const lines = (lyrics.plain || "").split("\n");
  const start = Math.min(Math.max(0, lyricScroll || 0), Math.max(0, lines.length - 1));
  els.lyricsText.className = "lyrics-text plain";
  els.lyricsText.textContent = lines.slice(start).join("\n");
}

function renderLyrics(track, state) {
  const lyrics = track?.lyrics;
  if (!track) {
    els.lyricsMode.textContent = "Waiting";
    els.lyricsMode.className = "";
    els.lyricsSource.textContent = "LRCLIB";
    els.lyricsText.className = "lyrics-text";
    els.lyricsText.textContent = "Lyrics will appear here when LRCLIB has a match.";
    return;
  }

  if (lyrics?.instrumental) {
    els.lyricsMode.textContent = "Instrumental";
    els.lyricsMode.className = "plain";
    els.lyricsSource.textContent = "LRCLIB";
    els.lyricsText.className = "lyrics-text";
    els.lyricsText.textContent = "Instrumental";
    return;
  }

  if (lyrics?.plain) {
    const hasSyncedDisplay = lyrics.synced && renderSyncedLyrics(track, lyrics, state.lyricOffsetSeconds);
    els.lyricsMode.textContent = hasSyncedDisplay ? "Synced" : "Plain";
    els.lyricsMode.className = hasSyncedDisplay ? "synced" : "plain";
    els.lyricsSource.textContent = hasSyncedDisplay
      ? `${lyrics.source || "LRCLIB"} +${Number(state.lyricOffsetSeconds || 0).toFixed(1)}s`
      : lyrics.source || "LRCLIB";
    if (!hasSyncedDisplay) renderPlainLyrics(lyrics, state.lyricScroll);
    return;
  }

  els.lyricsMode.textContent = track.lyricsError ? "Error" : "No Lyrics";
  els.lyricsMode.className = "plain";
  els.lyricsSource.textContent = track.lyricsError ? "Lookup failed" : "No match";
  els.lyricsText.className = "lyrics-text";
  els.lyricsText.textContent = track.lyricsError || "No lyrics found for this track.";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dbToNeedle(db) {
  const normalized = clamp((db + 50) / 40, 0, 1);
  return -42 + normalized * 84;
}

function formatDb(db) {
  return Number.isFinite(db) ? `${db.toFixed(1)} dBFS` : "-";
}

function renderLevel(level) {
  const leftRms = level?.leftRmsDb ?? level?.rmsDb;
  const rightRms = level?.rightRmsDb ?? level?.rmsDb;
  const leftPeak = level?.leftPeakDb ?? level?.peakDb ?? leftRms;
  const rightPeak = level?.rightPeakDb ?? level?.peakDb ?? rightRms;
  const usableLeft = Number.isFinite(leftRms) ? leftRms : -60;
  const usableRight = Number.isFinite(rightRms) ? rightRms : -60;
  const mid = (usableLeft + usableRight) / 2;
  const side = clamp((usableLeft - usableRight) * 1.85, -8, 8);
  meterState.leftTarget = mid + side;
  meterState.rightTarget = mid - side;

  const rms = Math.max(usableLeft, usableRight);
  const peak = Math.max(
    Number.isFinite(leftPeak) ? leftPeak : rms,
    Number.isFinite(rightPeak) ? rightPeak : rms,
  );
  const levelDb = rms * 0.9 + peak * 0.1;
  if (Number.isFinite(levelDb)) {
    waveformState.floor = waveformState.floor * 0.99 + Math.min(levelDb - 12, -44) * 0.01;
    waveformState.ceiling = waveformState.ceiling * 0.985 + Math.max(levelDb + 12, -12) * 0.015;
  }
  const span = Math.max(24, waveformState.ceiling - waveformState.floor);
  const amplitude = clamp((levelDb - waveformState.floor) / span, 0.03, 0.94);
  waveformState.points.push(amplitude);
  waveformState.points.shift();
}

function approach(current, target, deltaSeconds) {
  const rising = target > current;
  const rate = rising ? 32 : 5;
  const amount = 1 - Math.exp(-rate * deltaSeconds);
  return current + (target - current) * amount;
}

function animateMeters() {
  const now = performance.now();
  const deltaSeconds = Math.min(0.08, (now - meterState.lastFrame) / 1000);
  meterState.lastFrame = now;
  meterState.leftDisplay = approach(meterState.leftDisplay, meterState.leftTarget, deltaSeconds);
  meterState.rightDisplay = approach(meterState.rightDisplay, meterState.rightTarget, deltaSeconds);

  els.needleLeft.style.transform = `translateX(-50%) rotate(${dbToNeedle(meterState.leftDisplay)}deg)`;
  els.needleRight.style.transform = `translateX(-50%) rotate(${dbToNeedle(meterState.rightDisplay)}deg)`;
  els.leftDb.textContent = formatDb(meterState.leftDisplay);
  els.rightDb.textContent = formatDb(meterState.rightDisplay);

  const leftGlow = clamp((meterState.leftDisplay + 44) / 34, 0, 1);
  const rightGlow = clamp((meterState.rightDisplay + 44) / 34, 0, 1);
  els.meterLeft?.style.setProperty("--vu-glow-alpha", (leftGlow * 0.62).toFixed(3));
  els.meterLeft?.style.setProperty("--vu-glow-size", `${42 + leftGlow * 32}%`);
  els.meterRight?.style.setProperty("--vu-glow-alpha", (rightGlow * 0.62).toFixed(3));
  els.meterRight?.style.setProperty("--vu-glow-size", `${42 + rightGlow * 32}%`);
}

function drawWaveform() {
  const canvas = els.waveform;
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#161513";
  ctx.fillRect(0, 0, width, height);

  const mid = height / 2;
  ctx.strokeStyle = "rgba(231, 200, 111, 0.16)";
  ctx.lineWidth = Math.max(1, scale);
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(width, mid);
  ctx.stroke();

  const barCount = 96;
  const visiblePoints = waveformState.points.slice(-barCount);
  const gap = Math.max(1 * scale, width * 0.0018);
  const barWidth = Math.max(2 * scale, (width - gap * (barCount - 1)) / barCount);
  const maxBarHeight = height * 0.34;

  visiblePoints.forEach((value, index) => {
    const age = index / Math.max(1, visiblePoints.length - 1);
    const shaped = Math.pow(clamp(value, 0, 1), 1.85);
    const barHeight = Math.max(2 * scale, shaped * maxBarHeight);
    const x = index * (barWidth + gap);
    const alpha = 0.18 + age * 0.72;
    const ledWidth = Math.max(1 * scale, barWidth * 0.42);
    const ledX = x + (barWidth - ledWidth) / 2;
    const capHeight = Math.max(1, Math.min(3 * scale, barHeight * 0.16));
    ctx.fillStyle = `rgba(231, 200, 111, ${alpha * 0.82})`;
    ctx.fillRect(ledX, mid - barHeight, ledWidth, barHeight * 2);
    ctx.fillStyle = `rgba(127, 199, 182, ${alpha * 0.55})`;
    ctx.fillRect(ledX, mid - barHeight, ledWidth, capHeight);
    ctx.fillRect(ledX, mid + barHeight - capHeight, ledWidth, capHeight);
  });

}

function render(data) {
  const previousTrackId = latestState?.current?.id;
  latestState = data;
  if (previousTrackId !== data.current?.id) {
    lastSyncedActiveIndex = null;
  }
  const track = data.current;
  els.statusText.textContent = data.message || data.status || "Listening";
  els.statusDot.classList.toggle("error", data.status === "error");

  if (track) {
    els.title.textContent = track.title || "Unknown Title";
    els.artist.textContent = track.artist || "Unknown Artist";
    els.album.textContent = track.album || "-";
    els.released.textContent = track.released || "-";
    setCover(track.cover);

  } else {
    els.title.textContent = "Listening...";
    els.artist.textContent = data.error || "Waiting for the first recognition pass.";
    els.album.textContent = "-";
    els.released.textContent = "-";
    setCover("");
  }

  els.lastScan.textContent = data.lastScan ? timeAgo(data.lastScan.finishedAt) : "-";
  els.nextScan.textContent = timeUntil(data.nextScanAt);
  renderLyrics(track, data);
  renderLevel(data.level);
  renderHistory(data.history || []);
}

async function refresh() {
  const response = await fetch("/api/state", { cache: "no-store" });
  render(await response.json());
}

function refreshSyncedLyrics() {
  if (latestState?.current?.lyrics?.synced) {
    renderLyrics(latestState.current, latestState);
  }
}

async function refreshLevel() {
  const response = await fetch("/api/level", { cache: "no-store" });
  renderLevel(await response.json());
}

refresh();
refreshLevel();
animateMeters();
drawWaveform();
setInterval(animateMeters, 100);
setInterval(drawWaveform, 250);
setInterval(refresh, 5000);
setInterval(refreshLevel, 250);
setInterval(refreshSyncedLyrics, 500);
