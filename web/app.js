const els = {
  cover: document.querySelector("#cover"),
  recordFallback: document.querySelector("#recordFallback"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  versionText: document.querySelector("#versionText"),
  title: document.querySelector("#title"),
  artist: document.querySelector("#artist"),
  album: document.querySelector("#album"),
  released: document.querySelector("#released"),
  genre: document.querySelector("#genre"),
  writtenBy: document.querySelector("#writtenBy"),
  triviaPanel: document.querySelector("#triviaPanel"),
  triviaTopic: document.querySelector("#triviaTopic"),
  triviaQuestion: document.querySelector("#triviaQuestion"),
  triviaChoices: document.querySelector("#triviaChoices"),
  triviaAnswer: document.querySelector("#triviaAnswer"),
  triviaIndex: document.querySelector("#triviaIndex"),
  needleLeft: document.querySelector("#needleLeft"),
  needleRight: document.querySelector("#needleRight"),
  meterLeft: document.querySelector("#needleLeft")?.closest(".vu-meter"),
  meterRight: document.querySelector("#needleRight")?.closest(".vu-meter"),
  leftDb: document.querySelector("#leftDb"),
  rightDb: document.querySelector("#rightDb"),
  spectrum: document.querySelector("#spectrum"),
  spectrumWrap: document.querySelector("#spectrumWrap"),
  linearPanel: document.querySelector("#linearPanel"),
  linearLeftBar: document.querySelector("#linearLeftBar"),
  linearRightBar: document.querySelector("#linearRightBar"),
  linearLeftDb: document.querySelector("#linearLeftDb"),
  linearRightDb: document.querySelector("#linearRightDb"),
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

const spectrumState = {
  bands: Array.from({ length: 32 }, () => 0),
  display: Array.from({ length: 32 }, () => 0),
  lastPaint: 0,
};

const spectrumPalettes = {
  amber: {
    low: "rgba(127, 199, 182, 0.88)",
    mid: "rgba(231, 200, 111, {alpha})",
    high: "rgba(223, 123, 104, 0.95)",
    top: "rgba(244, 240, 232, 0.86)",
  },
  green: {
    low: "rgba(127, 199, 182, 0.88)",
    mid: "rgba(159, 216, 111, {alpha})",
    high: "rgba(226, 125, 101, 0.95)",
    top: "rgba(232, 244, 220, 0.86)",
  },
  blue: {
    low: "rgba(127, 199, 182, 0.88)",
    mid: "rgba(115, 180, 223, {alpha})",
    high: "rgba(226, 125, 101, 0.95)",
    top: "rgba(225, 241, 248, 0.86)",
  },
};

let latestState = null;
let lastSyncedActiveIndex = null;
let activeArtTrackId = null;
let artRotationStartedAt = Date.now();
let lastPlainLyricsKey = "";

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
    if (els.cover.getAttribute("src") !== url) {
      els.cover.src = url;
    }
    els.cover.classList.remove("hidden");
    els.recordFallback.classList.add("hidden");
  } else {
    els.cover.removeAttribute("src");
    els.cover.classList.add("hidden");
    els.recordFallback.classList.remove("hidden");
  }
}

function uniqueValues(values) {
  return values.filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);
}

function renderArtwork(track) {
  if (!track) {
    activeArtTrackId = null;
    setCover("");
    return;
  }

  const trackId = track.id || `${track.artist || ""}:${track.title || ""}`;
  if (activeArtTrackId !== trackId) {
    activeArtTrackId = trackId;
    artRotationStartedAt = Date.now();
  }

  const images = uniqueValues([track.cover, track.artistImage]);
  if (!images.length) {
    setCover("");
    return;
  }

  const imageIndex = images.length > 1
    ? Math.floor((Date.now() - artRotationStartedAt) / 8000) % images.length
    : 0;
  els.cover.alt = imageIndex === 1 ? `${track.artist || "Artist"} image` : `${track.title || "Album"} cover`;
  setCover(images[imageIndex]);
}

function formatList(values) {
  if (!Array.isArray(values) || !values.length) return "-";
  return values.filter(Boolean).join(", ") || "-";
}

function renderTrackInfo(track) {
  const info = track?.songInfo;
  els.album.textContent = info?.originalRelease || track?.album || "-";
  els.released.textContent = info?.originalReleaseDate || track?.released || "-";
  els.writtenBy.textContent = formatList(info?.writtenBy);
  els.genre.textContent = info?.genre || track?.genre || "-";
}

const TRIVIA_QUESTION_MS = 20000;
const TRIVIA_ANSWER_MS = 10000;
const TRIVIA_CHOICE_LETTERS = ["A", "B", "C", "D"];
const triviaState = {
  trackId: null,
  items: [],
  index: 0,
  phase: "question",
  phaseStartedAt: 0,
  rendered: { itemKey: null, phase: null },
};

function resetTrivia(trackId, items) {
  triviaState.trackId = trackId;
  triviaState.items = Array.isArray(items) ? items : [];
  triviaState.index = 0;
  triviaState.phase = "question";
  triviaState.phaseStartedAt = Date.now();
  triviaState.rendered = { itemKey: null, phase: null };
}

function renderTrivia(track) {
  const items = track?.songInfo?.trivia || [];
  const trackId = track?.id || null;
  if (trackId !== triviaState.trackId) {
    resetTrivia(trackId, items);
  } else if (triviaState.items.length !== items.length) {
    triviaState.items = items;
    if (triviaState.index >= items.length) triviaState.index = 0;
    triviaState.rendered = { itemKey: null, phase: null };
  }
  if (!triviaState.items.length || !track) {
    els.triviaPanel?.classList.add("hidden");
    return;
  }
  els.triviaPanel?.classList.remove("hidden");
  paintTrivia();
}

function paintTrivia() {
  if (!triviaState.items.length || !els.triviaChoices) return;
  const item = triviaState.items[triviaState.index];
  if (!item) return;

  const itemKey = `${triviaState.trackId || ""}:${triviaState.index}`;
  const needsChoicesRebuild = triviaState.rendered.itemKey !== itemKey;
  if (needsChoicesRebuild) {
    els.triviaQuestion.textContent = item.question || "";
    els.triviaTopic.textContent = item.topic ? item.topic[0].toUpperCase() + item.topic.slice(1) : "";
    els.triviaAnswer.textContent = item.answer || "";
    els.triviaChoices.replaceChildren();
    (item.choices || []).forEach((choice, idx) => {
      const li = document.createElement("li");
      li.className = "trivia-choice";
      li.dataset.index = String(idx);
      const letter = document.createElement("span");
      letter.className = "trivia-choice-letter";
      letter.textContent = TRIVIA_CHOICE_LETTERS[idx] || "";
      const text = document.createElement("span");
      text.className = "trivia-choice-text";
      text.textContent = choice;
      li.append(letter, text);
      els.triviaChoices.append(li);
    });
    els.triviaIndex.textContent = `${triviaState.index + 1} / ${triviaState.items.length}`;
  }

  if (needsChoicesRebuild || triviaState.rendered.phase !== triviaState.phase) {
    const revealed = triviaState.phase === "answer";
    els.triviaPanel.classList.toggle("revealed", revealed);
    els.triviaChoices.querySelectorAll(".trivia-choice").forEach((node, idx) => {
      node.classList.toggle("correct", revealed && idx === item.correctIndex);
    });
  }

  triviaState.rendered = { itemKey, phase: triviaState.phase };
}

function tickTrivia() {
  if (!triviaState.items.length) return;
  const elapsed = Date.now() - triviaState.phaseStartedAt;
  const duration = triviaState.phase === "question" ? TRIVIA_QUESTION_MS : TRIVIA_ANSWER_MS;
  if (elapsed < duration) return;
  if (triviaState.phase === "question") {
    triviaState.phase = "answer";
  } else {
    triviaState.phase = "question";
    triviaState.index = (triviaState.index + 1) % triviaState.items.length;
  }
  triviaState.phaseStartedAt = Date.now();
  paintTrivia();
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

function lineHeightPixels(element) {
  const parsed = Number.parseFloat(getComputedStyle(element).lineHeight);
  return Number.isFinite(parsed) ? parsed : 24;
}

function renderPlainLyrics(track, lyrics, lyricScroll, lyricOffsetSeconds) {
  const plain = lyrics.plain || "";
  const plainKey = `${track?.id || ""}:${lyrics.id || ""}:${plain.length}`;
  els.lyricsText.className = "lyrics-text plain";
  if (lastPlainLyricsKey !== plainKey) {
    lastPlainLyricsKey = plainKey;
    els.lyricsText.textContent = plain;
  }

  const duration = Number(lyrics.duration);
  const position = playbackPosition(track, lyricOffsetSeconds);
  if (!Number.isFinite(duration) || duration <= 0 || position === null) return;

  const scrollMax = Math.max(0, els.lyricsText.scrollHeight - els.lyricsText.clientHeight);
  if (!scrollMax) return;

  const songProgress = clamp(position / duration, 0, 1);
  const scrollProgress = clamp((songProgress - 0.04) / 0.72, 0, 1);
  const manualNudge = Math.round(Number(lyricScroll || 0)) * lineHeightPixels(els.lyricsText);
  els.lyricsText.scrollTop = clamp(scrollMax * scrollProgress + manualNudge, 0, scrollMax);
}

function renderLyrics(track, state) {
  const lyrics = track?.lyrics;
  if (!track) {
    els.lyricsMode.textContent = "Waiting";
    els.lyricsMode.className = "";
    els.lyricsSource.textContent = "LRCLIB";
    els.lyricsText.className = "lyrics-text";
    els.lyricsText.textContent = "Lyrics will appear here when LRCLIB has a match.";
    lastPlainLyricsKey = "";
    return;
  }

  if (lyrics?.instrumental) {
    els.lyricsMode.textContent = "Instrumental";
    els.lyricsMode.className = "plain";
    els.lyricsSource.textContent = "LRCLIB";
    els.lyricsText.className = "lyrics-text";
    els.lyricsText.textContent = "Instrumental";
    lastPlainLyricsKey = "";
    return;
  }

  if (lyrics?.plain) {
    const hasSyncedDisplay = lyrics.synced && renderSyncedLyrics(track, lyrics, state.lyricOffsetSeconds);
    els.lyricsMode.textContent = hasSyncedDisplay ? "Synced" : "Plain";
    els.lyricsMode.className = hasSyncedDisplay ? "synced" : "plain";
    els.lyricsSource.textContent = hasSyncedDisplay
      ? `${lyrics.source || "LRCLIB"} +${Number(state.lyricOffsetSeconds || 0).toFixed(1)}s`
      : lyrics.source || "LRCLIB";
    if (!hasSyncedDisplay) renderPlainLyrics(track, lyrics, state.lyricScroll, state.lyricOffsetSeconds);
    return;
  }

  els.lyricsMode.textContent = track.lyricsError ? "Error" : "No Lyrics";
  els.lyricsMode.className = "plain";
  els.lyricsSource.textContent = track.lyricsError ? "Lookup failed" : "No match";
  els.lyricsText.className = "lyrics-text";
  els.lyricsText.textContent = track.lyricsError || "No lyrics found for this track.";
  lastPlainLyricsKey = "";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dbToNeedle(db) {
  const normalized = clamp((db + 62) / 42, 0, 1);
  return -42 + normalized * 84;
}

function dbToLinearPercent(db) {
  return clamp((db + 52) / 52, 0, 1) * 100;
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
  if (Array.isArray(level?.spectrumBands) && level.spectrumBands.length) {
    spectrumState.bands = level.spectrumBands.map((value) => {
      const boosted = Math.pow(clamp(Number(value) || 0, 0, 1), 0.62) * 1.24;
      return clamp(boosted, 0, 1);
    });
    if (spectrumState.display.length !== spectrumState.bands.length) {
      spectrumState.display = Array.from({ length: spectrumState.bands.length }, () => 0);
    }
  }
}

function approach(current, target, deltaSeconds) {
  const rising = target > current;
  const rate = rising ? 52 : 13;
  const amount = 1 - Math.exp(-rate * deltaSeconds);
  return current + (target - current) * amount;
}

function animateMeters() {
  const now = performance.now();
  const deltaSeconds = Math.min(0.08, (now - meterState.lastFrame) / 1000);
  meterState.lastFrame = now;
  meterState.leftDisplay = approach(meterState.leftDisplay, meterState.leftTarget, deltaSeconds);
  meterState.rightDisplay = approach(meterState.rightDisplay, meterState.rightTarget, deltaSeconds);

  if (els.needleLeft) els.needleLeft.style.transform = `translateX(-50%) rotate(${dbToNeedle(meterState.leftDisplay)}deg)`;
  if (els.needleRight) els.needleRight.style.transform = `translateX(-50%) rotate(${dbToNeedle(meterState.rightDisplay)}deg)`;
  if (els.leftDb) els.leftDb.textContent = formatDb(meterState.leftDisplay);
  if (els.rightDb) els.rightDb.textContent = formatDb(meterState.rightDisplay);
  if (els.linearLeftDb) els.linearLeftDb.textContent = formatDb(meterState.leftDisplay);
  if (els.linearRightDb) els.linearRightDb.textContent = formatDb(meterState.rightDisplay);
  if (els.linearLeftBar) els.linearLeftBar.style.width = `${dbToLinearPercent(meterState.leftDisplay).toFixed(1)}%`;
  if (els.linearRightBar) els.linearRightBar.style.width = `${dbToLinearPercent(meterState.rightDisplay).toFixed(1)}%`;

  const leftGlow = clamp((meterState.leftDisplay + 56) / 42, 0, 1);
  const rightGlow = clamp((meterState.rightDisplay + 56) / 42, 0, 1);
  els.meterLeft?.style.setProperty("--vu-glow-alpha", (leftGlow * 0.62).toFixed(3));
  els.meterLeft?.style.setProperty("--vu-glow-size", `${42 + leftGlow * 32}%`);
  els.meterRight?.style.setProperty("--vu-glow-alpha", (rightGlow * 0.62).toFixed(3));
  els.meterRight?.style.setProperty("--vu-glow-size", `${42 + rightGlow * 32}%`);
}

function drawSpectrum() {
  const canvas = els.spectrum;
  if (!canvas || els.spectrumWrap?.classList.contains("hidden")) return;

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

  const bands = spectrumState.bands;
  const gap = Math.max(2 * scale, width * 0.004);
  const barWidth = Math.max(3 * scale, (width - gap * (bands.length - 1)) / Math.max(1, bands.length));
  const bottom = height - 12 * scale;
  const maxBarHeight = height - 28 * scale;

  bands.forEach((target, index) => {
    const current = spectrumState.display[index] ?? 0;
    const rising = target > current;
    const rate = rising ? 0.45 : 0.12;
    const value = current + (target - current) * rate;
    spectrumState.display[index] = value;

    const shaped = Math.pow(clamp(value, 0, 1), 0.86);
    const barHeight = Math.max(2 * scale, shaped * maxBarHeight);
    const x = index * (barWidth + gap);
    const y = bottom - barHeight;
    const hueBlend = index / Math.max(1, bands.length - 1);
    const hot = shaped > 0.78;
    const theme = document.body.dataset.vuTheme || "amber";
    const palette = spectrumPalettes[theme] || spectrumPalettes.amber;
    const midAlpha = (0.72 + hueBlend * 0.18).toFixed(3);

    const gradient = ctx.createLinearGradient(0, bottom, 0, y);
    gradient.addColorStop(0, palette.low);
    gradient.addColorStop(0.62, palette.mid.replace("{alpha}", midAlpha));
    gradient.addColorStop(1, hot ? palette.high : palette.top);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "rgba(244, 240, 232, 0.16)";
    ctx.fillRect(x, Math.max(0, y - 3 * scale), barWidth, Math.max(1, 2 * scale));
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
  els.versionText.textContent = `v${data.config?.appVersion || "-"}`;
  els.statusDot.classList.toggle("error", data.status === "error");
  const meterDisplayMode = data.config?.meterDisplayMode || "vu";
  document.body.dataset.vuTheme = data.config?.vuMeterTheme || "amber";
  document.body.dataset.meterMode = meterDisplayMode;
  els.spectrumWrap?.classList.toggle("hidden", meterDisplayMode !== "spectrum");
  els.linearPanel?.classList.toggle("hidden", meterDisplayMode !== "linear");
  els.meterLeft?.classList.toggle("hidden", meterDisplayMode !== "vu");
  els.meterRight?.classList.toggle("hidden", meterDisplayMode !== "vu");

  if (track) {
    els.title.textContent = track.title || "Unknown Title";
    els.artist.textContent = track.artist || "Unknown Artist";
    renderArtwork(track);
  } else {
    els.title.textContent = "Listening...";
    els.artist.textContent = data.error || "Waiting for the first recognition pass.";
    renderArtwork(null);
  }

  renderLyrics(track, data);
  renderLevel(data.level);
  renderTrackInfo(track);
  renderTrivia(track);
}

async function refresh() {
  const response = await fetch("/api/state", { cache: "no-store" });
  render(await response.json());
}

function refreshLyricsDisplay() {
  if (latestState?.current?.lyrics?.synced || latestState?.current?.lyrics?.plain) {
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
setInterval(animateMeters, 50);
setInterval(drawSpectrum, 80);
setInterval(() => renderArtwork(latestState?.current), 1000);
setInterval(refresh, 5000);
setInterval(refreshLevel, 250);
setInterval(refreshLyricsDisplay, 500);
setInterval(tickTrivia, 500);
