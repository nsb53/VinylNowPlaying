const statusEl = document.querySelector("#controlStatus");
const versionEl = document.querySelector("#controlVersion");
const titleEl = document.querySelector("#controlTitle");
const artistEl = document.querySelector("#controlArtist");
const coverEl = document.querySelector("#controlCover");
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

let pageBuild = null;

async function refreshControl() {
  const response = await fetch("/api/state", { cache: "no-store" });
  const state = await response.json();
  // The app was updated since this page loaded: reload to get the new buttons.
  if (state.build) {
    if (pageBuild && state.build !== pageBuild) location.reload();
    pageBuild = state.build;
  }
  latestState = state;
  const track = state.current;
  statusEl.textContent = state.message || state.status || "Listening";
  versionEl.textContent = `v${state.config?.appVersion || "-"}`;
  titleEl.textContent = track?.title || "Listening...";
  artistEl.textContent = track?.artist || "Waiting for recognition.";
  const cover = track?.cover || "";
  if (coverEl.dataset.url !== cover) {
    coverEl.dataset.url = cover;
    coverEl.style.backgroundImage = cover ? `url("${cover.replace(/"/g, "%22")}")` : "";
  }
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
  showCurrentTheme(state.config?.displayTheme || "mcm");
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

// ---- TV theme picker: a list with colour icons and a live preview ----
const themePickerEl = document.querySelector("#themePicker");
const themeListEl = document.querySelector("#themeList");
const themeCurrentIconEl = document.querySelector("#themeCurrentIcon");
const themeCurrentNameEl = document.querySelector("#themeCurrentName");
const themeCurrentGroupEl = document.querySelector("#themeCurrentGroup");
const themePreviewEl = document.querySelector("#themePreview");
const themePreviewFrameEl = document.querySelector("#themePreviewFrame");
const themePreviewNameEl = document.querySelector("#themePreviewName");
const themePreviewIconEl = document.querySelector("#themePreviewIcon");
const themeApplyEl = document.querySelector("#themeApply");
const themeCancelEl = document.querySelector("#themeCancel");
let themes = [];
let currentTheme = null;
let previewTheme = null;

function paintIcon(el, theme) {
  const [a, b, c] = theme?.colors || ["#333", "#555", "#777"];
  el.style.background = `linear-gradient(135deg, ${a} 0 50%, ${b} 50% 75%, ${c} 75%)`;
}

function themeById(id) {
  return themes.find((theme) => theme.id === id);
}

function showCurrentTheme(id) {
  if (id === currentTheme || !themes.length) return;
  currentTheme = id;
  const theme = themeById(id);
  themeCurrentNameEl.textContent = theme?.label || id;
  themeCurrentGroupEl.textContent = theme?.group || "";
  paintIcon(themeCurrentIconEl, theme);
  themeListEl.querySelectorAll("[role=option]").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.theme === id));
  });
}

function buildThemeList() {
  themeListEl.replaceChildren();
  let group = null;
  themes.forEach((theme) => {
    if (theme.group !== group) {
      group = theme.group;
      const heading = document.createElement("div");
      heading.className = "theme-group";
      heading.textContent = group;
      themeListEl.append(heading);
    }
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option";
    option.setAttribute("role", "option");
    option.dataset.theme = theme.id;
    option.setAttribute("aria-selected", String(theme.id === currentTheme));
    const icon = document.createElement("span");
    icon.className = "swatch";
    paintIcon(icon, theme);
    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = theme.label;
    const tick = document.createElement("span");
    tick.className = "tick";
    tick.textContent = "On TV";
    option.append(icon, name, tick);
    option.addEventListener("click", () => openPreview(theme.id));
    themeListEl.append(option);
  });
}

function setListOpen(open) {
  themeListEl.hidden = !open;
  themePickerEl.setAttribute("aria-expanded", String(open));
  if (open) {
    closePreview();
    // Scroll the list (not the page) so the theme on the TV is in view.
    const selected = themeListEl.querySelector('[aria-selected="true"]');
    if (selected) themeListEl.scrollTop = selected.offsetTop - themeListEl.clientHeight / 2 + selected.offsetHeight / 2;
  }
}

function openPreview(id) {
  const theme = themeById(id);
  if (!theme) return;
  previewTheme = id;
  setListOpen(false);
  themePreviewNameEl.textContent = theme.label;
  paintIcon(themePreviewIconEl, theme);
  // The TV page itself, pinned to this theme; it scales to fit the frame.
  themePreviewFrameEl.src = `/?theme=${encodeURIComponent(id)}&preview=1`;
  themeApplyEl.disabled = id === currentTheme;
  themeApplyEl.textContent = id === currentTheme ? "On TV now" : "Show on TV";
  themePreviewEl.hidden = false;
}

function closePreview() {
  themePreviewEl.hidden = true;
  previewTheme = null;
  // Unload the preview so it stops polling.
  themePreviewFrameEl.src = "about:blank";
}

themePickerEl.addEventListener("click", () => setListOpen(themeListEl.hidden));
themeCancelEl.addEventListener("click", closePreview);
themeApplyEl.addEventListener("click", async () => {
  if (!previewTheme) return;
  const id = previewTheme;
  await saveSettings({ displayTheme: id });
  showCurrentTheme(id);
  closePreview();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setListOpen(false);
    closePreview();
  }
});

fetch("/themes.json", { cache: "no-store" })
  .then((response) => response.json())
  .then((list) => {
    themes = list;
    buildThemeList();
    showCurrentTheme(latestState?.config?.displayTheme || "mcm");
  })
  .catch(() => {
    themeCurrentNameEl.textContent = "Themes unavailable";
  });
