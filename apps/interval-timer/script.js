const timeDisplay = document.getElementById("timeDisplay");
const currentIntervalLabel = document.getElementById("currentIntervalLabel");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const tabTitleToggleBtn = document.getElementById("tabTitleToggleBtn");
const previewBtn = document.getElementById("previewBtn");
const intervalList = document.getElementById("intervalList");
const addIntervalBtn = document.getElementById("addIntervalBtn");
const soundSelect = document.getElementById("soundSelect");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
const DEFAULT_NEW_MINUTES = 5;
const STORAGE_KEY = "interval-timer:settings";
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1週間

const originalTitle = document.title;

let intervals = [5];
let currentIndex = 0;
let remainingSeconds = 0;
let phaseEndAt = 0;
let isRunning = false;
let intervalId = null;
let audioContext = null;
let gainNode = null;
let isTabTitleEnabled = false;
let scheduledPhaseEndAt = null;
let scheduledOscillators = [];

function clampMinutes(value) {
  const parsed = Math.round(Number(value));
  if (Number.isNaN(parsed)) return DEFAULT_NEW_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        intervals,
        sound: soundSelect.value,
        volume: volumeRange.value,
        savedAt: Date.now(),
      })
    );
  } catch (error) {
    // localStorageが使えない場合は保存をあきらめる
  }
}

function applySavedSettings() {
  const saved = loadSettings();
  if (!saved) return;

  if (Array.isArray(saved.intervals) && saved.intervals.length > 0) {
    intervals = saved.intervals.map(clampMinutes);
  }
  if (typeof saved.sound === "string" && sounds[saved.sound]) {
    soundSelect.value = saved.sound;
  }
  if (typeof saved.volume !== "undefined") {
    volumeRange.value = saved.volume;
    volumeValue.textContent = volumeRange.value;
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  currentIntervalLabel.textContent = `${currentIndex + 1} / ${intervals.length} · ${intervals[currentIndex]}分`;
  updateTabTitle();
}

function updateTabTitle() {
  if (!isTabTitleEnabled) return;
  const status = isRunning ? "▶" : "⏸";
  document.title = `${status} ${formatTime(remainingSeconds)} - ${originalTitle}`;
}

function renderIntervalList() {
  intervalList.innerHTML = "";

  intervals.forEach((minutes, index) => {
    const row = document.createElement("li");
    row.className = "interval-row" + (index === currentIndex ? " active" : "");

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(MIN_MINUTES);
    input.max = String(MAX_MINUTES);
    input.value = minutes;
    input.dataset.index = String(index);

    const unit = document.createElement("span");
    unit.className = "unit";
    unit.textContent = "分";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.dataset.index = String(index);
    removeBtn.disabled = intervals.length <= 1;
    removeBtn.setAttribute("aria-label", "削除");

    row.append(input, unit, removeBtn);
    intervalList.appendChild(row);
  });
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = Number(volumeRange.value) / 100;
  }
  return audioContext;
}

function playTone(ctx, startTime, frequency, duration, type = "sine") {
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
  return oscillator;
}

const sounds = {
  bell(ctx, now) {
    return [
      playTone(ctx, now, 880, 0.35, "sine"),
      playTone(ctx, now + 0.18, 1320, 0.35, "sine"),
    ];
  },
  chime(ctx, now) {
    return [1046, 784, 659].map((frequency, index) =>
      playTone(ctx, now + index * 0.15, frequency, 0.4, "triangle")
    );
  },
  beep(ctx, now) {
    return [0, 0.2, 0.4].map((offset) => playTone(ctx, now + offset, 1000, 0.12, "square"));
  },
  alarm(ctx, now) {
    const nodes = [];
    for (let i = 0; i < 4; i += 1) {
      nodes.push(playTone(ctx, now + i * 0.2, i % 2 === 0 ? 600 : 900, 0.18, "sawtooth"));
    }
    return nodes;
  },
};

function playChime() {
  const ctx = getAudioContext();
  const play = sounds[soundSelect.value] || sounds.bell;
  play(ctx, ctx.currentTime);
}

// 次の区間終了時刻に、Web Audio APIの時間軸で前もって音を予約する。
// 予約した音の再生自体はブラウザの音声処理スレッドが担うため、
// タブがバックグラウンドで間引かれても指定時刻に正確に鳴る。
function scheduleUpcomingChime() {
  if (!isRunning || scheduledPhaseEndAt === phaseEndAt) return;

  const ctx = getAudioContext();
  const secondsFromNow = (phaseEndAt - Date.now()) / 1000;
  if (secondsFromNow <= 0) return;

  const play = sounds[soundSelect.value] || sounds.bell;
  const nodes = play(ctx, ctx.currentTime + secondsFromNow);
  scheduledOscillators.push(...nodes);
  scheduledPhaseEndAt = phaseEndAt;
}

// 予約済みの音を取り消す（一時停止・リセット・設定変更時に使用）
function cancelScheduledChime() {
  if (audioContext) {
    scheduledOscillators.forEach((oscillator) => {
      try {
        oscillator.stop(audioContext.currentTime);
      } catch (error) {
        // 既に再生済み・停止済みの場合は無視
      }
    });
  }
  scheduledOscillators = [];
  scheduledPhaseEndAt = null;
}

function goToInterval(index) {
  currentIndex = index;
  remainingSeconds = intervals[currentIndex] * 60;
  if (isRunning) {
    cancelScheduledChime();
    phaseEndAt = Date.now() + remainingSeconds * 1000;
    scheduleUpcomingChime();
  }
}

function advanceInterval() {
  currentIndex = (currentIndex + 1) % intervals.length;
  phaseEndAt += intervals[currentIndex] * 60000;
}

// setIntervalの発火が遅延・間引きされても、実時間との差分から
// 正しい残り時間と現在の区間に補正する
function syncState() {
  if (!isRunning) return;

  const now = Date.now();
  let boundariesCrossed = 0;

  while (now >= phaseEndAt) {
    advanceInterval();
    boundariesCrossed += 1;
  }

  // 2区間以上をまたいでいた場合、予約済みの音は1回分しか鳴らせていないため
  // 復帰時に気づけるよう1回だけ知らせる
  if (boundariesCrossed > 1) {
    playChime();
  }

  remainingSeconds = Math.max(0, Math.round((phaseEndAt - now) / 1000));
  scheduleUpcomingChime();
}

function tick() {
  syncState();
  updateDisplay();
  renderIntervalList();
}

function start() {
  if (isRunning) return;
  getAudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  isRunning = true;
  phaseEndAt = Date.now() + remainingSeconds * 1000;
  toggleBtn.textContent = "一時停止";
  intervalId = setInterval(tick, 1000);
  scheduleUpcomingChime();
  updateTabTitle();
}

function pause() {
  if (!isRunning) return;
  syncState();
  cancelScheduledChime();
  isRunning = false;
  toggleBtn.textContent = "再生";
  clearInterval(intervalId);
  intervalId = null;
  updateTabTitle();
  updateDisplay();
  renderIntervalList();
}

function reset() {
  pause();
  goToInterval(0);
  updateDisplay();
  renderIntervalList();
}

toggleBtn.addEventListener("click", () => {
  if (isRunning) {
    pause();
  } else {
    start();
  }
});

resetBtn.addEventListener("click", reset);

tabTitleToggleBtn.addEventListener("click", () => {
  isTabTitleEnabled = !isTabTitleEnabled;
  tabTitleToggleBtn.textContent = isTabTitleEnabled ? "タブのタイマーを非表示" : "タイマーをタブに表示";

  if (isTabTitleEnabled) {
    updateTabTitle();
  } else {
    document.title = originalTitle;
  }
});

previewBtn.addEventListener("click", () => {
  getAudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  playChime();
});

addIntervalBtn.addEventListener("click", () => {
  intervals.push(DEFAULT_NEW_MINUTES);
  updateDisplay();
  renderIntervalList();
  saveSettings();
});

intervalList.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.matches("input[type='number']")) return;

  const index = Number(target.dataset.index);
  intervals[index] = clampMinutes(target.value);
  target.value = intervals[index];

  if (index === currentIndex && !isRunning) {
    remainingSeconds = intervals[currentIndex] * 60;
    updateDisplay();
  }
  saveSettings();
});

intervalList.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches(".remove-btn") || target.disabled) return;

  const index = Number(target.dataset.index);
  intervals.splice(index, 1);

  if (index < currentIndex) {
    currentIndex -= 1;
  } else if (index === currentIndex) {
    goToInterval(Math.min(currentIndex, intervals.length - 1));
  }

  updateDisplay();
  renderIntervalList();
  saveSettings();
});

soundSelect.addEventListener("change", () => {
  if (isRunning) {
    cancelScheduledChime();
    scheduleUpcomingChime();
  }
  saveSettings();
});

volumeRange.addEventListener("input", () => {
  volumeValue.textContent = volumeRange.value;
  if (gainNode) {
    gainNode.gain.value = Number(volumeRange.value) / 100;
  }
  saveSettings();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !isRunning) return;
  syncState();
  updateDisplay();
  renderIntervalList();
});

applySavedSettings();
goToInterval(0);
updateDisplay();
renderIntervalList();
