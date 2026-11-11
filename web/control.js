const statusEl = document.querySelector("#controlStatus");
const versionEl = document.querySelector("#controlVersion");
const titleEl = document.querySelector("#controlTitle");
const artistEl = document.querySelector("#controlArtist");
const scanEl = document.querySelector("#controlScan");
const nextEl = document.querySelector("#controlNext");
const lastEl = document.querySelector("#controlLast");
const levelEl = document.querySelector("#controlLevel");
const lyricsEl = document.querySelector("#controlLyrics");
const lyricOffsetEl = document.querySelector("#controlLyricOffset");
const defaultOffsetEl = document.querySelector("#controlDefaultOffset");
const lyricScrollEl = document.querySelector("#controlLyricScroll");
const lyricButtons = document.querySelectorAll("[data-lyric-offset], [data-lyric-scroll], [data-lyric-reset]");
const defaultButtons = document.querySelectorAll("[data-default-offset]");
const meterModeButtons = document.querySelectorAll("[data-meter-mode]");
const vuThemeButtons = document.querySelectorAll("[data-vu-theme]");
const displayThemeButtons = document.querySelectorAll("[data-display-theme]");
const saveCurrentDefaultEl = document.querySelector("#saveCurrentDefault");
const manualArtistEl = document.querySelector("#manualArtist");
const manualAlbumEl = document.querySelector("#manualAlbum");
const manualReleasedEl = document.querySelector("#manualReleased");
const manualTracksEl = document.querySelector("#manualTracks");
const manualSelectEl = document.querySelector("#manualSelect");
const manualLoadEl = document.querySelector("#manualLoad");
const manualUseEl = document.querySelector("#manualUse");
const manualPrevEl = document.querySelector("#manualPrev");
const manualNextEl = document.querySelector("#manualNext");
const manualClearEl = document.querySelector("#manualClear");
let latestState = null;

function timeAgo(value) {
  if (!value) return "-";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

function signedSeconds(value) {
  const seconds = Number(value || 0);
  return `${seconds > 0 ? "+" : ""}${seconds.toFixed(1)}s`;
}

function timeUntil(value) {
  if (!value) return "-";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  if (seconds <= 0) return "soon";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function parseManualTracks() {
  return manualTracksEl.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({
      title,
      artist: manualArtistEl.value.trim(),
      album: manualAlbumEl.value.trim(),
      released: manualReleasedEl.value.trim(),
    }));
}

function syncManualSelectFromTextarea() {
  const selected = manualSelectEl.value;
  manualSelectEl.replaceChildren();
  parseManualTracks().forEach((track, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${track.title}`;
    manualSelectEl.append(option);
  });
  if (selected) manualSelectEl.value = selected;
}

function syncManualControls(state) {
  const queue = state.manualQueue || [];
  if (!queue.length) {
    syncManualSelectFromTextarea();
    return;
  }
  if (!manualTracksEl.value.trim()) {
    manualTracksEl.value = queue.map((track) => track.title).join("\n");
  }
  if (!manualArtistEl.value.trim()) manualArtistEl.value = queue[0]?.artist || "";
  if (!manualAlbumEl.value.trim()) manualAlbumEl.value = queue[0]?.album || "";
  if (!manualReleasedEl.value.trim()) manualReleasedEl.value = queue[0]?.released || "";
  manualSelectEl.replaceChildren();
  queue.forEach((track, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${track.title}`;
    manualSelectEl.append(option);
  });
  manualSelectEl.value = String(Math.max(0, state.manualIndex || 0));
}

async function manualControl(payload) {
  await fetch("/api/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  refreshControl();
}

async function refreshControl() {
  const response = await fetch("/api/state", { cache: "no-store" });
  const state = await response.json();
  latestState = state;
  const track = state.current;
  statusEl.textContent = state.message || state.status || "Listening";
  versionEl.textContent = `v${state.config?.appVersion || "-"}`;
  titleEl.textContent = track?.title || "Listening...";
  artistEl.textContent = track?.artist || "Waiting for recognition.";
  nextEl.textContent = timeUntil(state.nextScanAt);
  lastEl.textContent = state.lastScan ? timeAgo(state.lastScan.finishedAt) : "-";
  levelEl.textContent = state.level?.peakDb ? `${state.level.peakDb.toFixed(1)} dBFS` : "-";
  lyricsEl.textContent = !track ? "-" : track.lyrics?.synced ? "Timed" : track.lyrics?.plain ? "Untimed" : "None";
  lyricOffsetEl.textContent = signedSeconds(state.lyricOffsetSeconds);
  defaultOffsetEl.textContent = signedSeconds(state.config?.defaultLyricOffsetSeconds);
  lyricScrollEl.textContent = `${state.lyricScroll || 0}`;
  meterModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.meterMode === (state.config?.meterDisplayMode || "vu"));
  });
  vuThemeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.vuTheme === (state.config?.vuMeterTheme || "amber"));
  });
  displayThemeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.displayTheme === (state.config?.displayTheme || "mcm"));
  });
  syncManualControls(state);
}

async function adjustLyrics(payload) {
  await fetch("/api/lyrics/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  refreshControl();
}

async function saveSettings(payload) {
  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  refreshControl();
}

scanEl.addEventListener("click", async () => {
  scanEl.disabled = true;
  statusEl.textContent = "Scan requested";
  await fetch("/api/scan", { method: "POST" });
  setTimeout(() => {
    scanEl.disabled = false;
    refreshControl();
  }, 1200);
});

lyricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    adjustLyrics({
      offsetDelta: Number(button.dataset.lyricOffset || 0),
      scrollDelta: Number(button.dataset.lyricScroll || 0),
      resetScroll: button.dataset.lyricReset === "true",
      resetOffset: button.dataset.lyricReset === "true",
    });
  });
});

defaultButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const currentDefault = Number(latestState?.config?.defaultLyricOffsetSeconds || 0);
    saveSettings({
      defaultLyricOffsetSeconds: currentDefault + Number(button.dataset.defaultOffset || 0),
    });
  });
});

saveCurrentDefaultEl.addEventListener("click", () => {
  saveSettings({
    defaultLyricOffsetSeconds: Number(latestState?.lyricOffsetSeconds || 0),
  });
});

meterModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveSettings({ meterDisplayMode: button.dataset.meterMode });
  });
});

vuThemeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveSettings({ vuMeterTheme: button.dataset.vuTheme });
  });
});

displayThemeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveSettings({ displayTheme: button.dataset.displayTheme });
  });
});

manualTracksEl.addEventListener("input", syncManualSelectFromTextarea);

manualLoadEl.addEventListener("click", () => {
  manualControl({
    action: "set",
    artist: manualArtistEl.value,
    album: manualAlbumEl.value,
    released: manualReleasedEl.value,
    tracks: parseManualTracks(),
    index: Number(manualSelectEl.value || 0),
  });
});

manualUseEl.addEventListener("click", () => {
  const tracks = parseManualTracks();
  if (tracks.length && !(latestState?.manualQueue || []).length) {
    manualControl({
      action: "set",
      artist: manualArtistEl.value,
      album: manualAlbumEl.value,
      released: manualReleasedEl.value,
      tracks,
      index: Number(manualSelectEl.value || 0),
    });
    return;
  }
  manualControl({ action: "select", index: Number(manualSelectEl.value || 0) });
});

manualPrevEl.addEventListener("click", () => manualControl({ action: "previous" }));
manualNextEl.addEventListener("click", () => manualControl({ action: "next" }));
manualClearEl.addEventListener("click", () => manualControl({ action: "clear" }));

// ---- Console: a live view of the server's log ----
const consoleEl = document.querySelector("#console");
const consolePauseEl = document.querySelector("#consolePause");
const consoleClearEl = document.querySelector("#consoleClear");
const CONSOLE_MAX_LINES = 400;
let lastLogSeq = 0;
let consolePaused = false;

function logLineClass(line) {
  if (/error|failed/i.test(line.event + " " + line.text)) return "bad";
  if (/result=matched|action=matched/.test(line.text)) return "good";
  return "";
}

function appendLogLines(lines) {
  // Follow new lines only while the reader is already at the bottom.
  const atBottom = consoleEl.scrollHeight - consoleEl.scrollTop - consoleEl.clientHeight < 40;
  consoleEl.querySelector(".empty")?.remove();
  lines.forEach((line) => {
    const row = document.createElement("div");
    row.className = logLineClass(line);
    const time = document.createElement("span");
    time.className = "time";
    time.textContent = `${line.time} `;
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `${line.event} `;
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = line.text;
    row.append(time, tag, text);
    consoleEl.append(row);
  });
  while (consoleEl.childElementCount > CONSOLE_MAX_LINES) consoleEl.firstElementChild.remove();
  if (atBottom) consoleEl.scrollTop = consoleEl.scrollHeight;
}

function showConsoleNote(message) {
  consoleEl.replaceChildren();
  const note = document.createElement("div");
  note.className = "empty";
  note.textContent = message;
  consoleEl.append(note);
}

async function refreshConsole() {
  if (consolePaused) return;
  try {
    const response = await fetch(`/api/logs?after=${lastLogSeq}`, { cache: "no-store" });
    const { lines, last } = await response.json();
    if (last < lastLogSeq) {
      // The server restarted and numbers its lines from 1 again.
      lastLogSeq = 0;
      return;
    }
    if (!lines.length) return;
    lastLogSeq = lines[lines.length - 1].seq;
    appendLogLines(lines);
  } catch {
    // The server is restarting or unreachable; the next poll tries again.
    lastLogSeq = 0;
  }
}

consolePauseEl.addEventListener("click", () => {
  consolePaused = !consolePaused;
  consolePauseEl.textContent = consolePaused ? "Resume" : "Pause";
  consolePauseEl.setAttribute("aria-pressed", String(consolePaused));
  if (!consolePaused) refreshConsole();
});

consoleClearEl.addEventListener("click", () => showConsoleNote("Cleared. New activity appears here."));

showConsoleNote("Waiting for activity...");
refreshConsole();
setInterval(refreshConsole, 1000);

syncManualSelectFromTextarea();
refreshControl();
setInterval(refreshControl, 2000);
