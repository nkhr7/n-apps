const timeDisplay = document.getElementById("timeDisplay");
const currentIntervalLabel = document.getElementById("currentIntervalLabel");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const previewBtn = document.getElementById("previewBtn");
const intervalList = document.getElementById("intervalList");
const addIntervalBtn = document.getElementById("addIntervalBtn");
const soundSelect = document.getElementById("soundSelect");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
const DEFAULT_NEW_MINUTES = 5;

let intervals = [5];
let currentIndex = 0;
let remainingSeconds = intervals[currentIndex] * 60;
let isRunning = false;
let intervalId = null;
let audioContext = null;
let gainNode = null;

function clampMinutes(value) {
  const parsed = Math.round(Number(value));
  if (Number.isNaN(parsed)) return DEFAULT_NEW_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, parsed));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  currentIntervalLabel.textContent = `${currentIndex + 1} / ${intervals.length} · ${intervals[currentIndex]}分`;
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
}

const sounds = {
  bell(ctx, now) {
    playTone(ctx, now, 880, 0.35, "sine");
    playTone(ctx, now + 0.18, 1320, 0.35, "sine");
  },
  chime(ctx, now) {
    [1046, 784, 659].forEach((frequency, index) => {
      playTone(ctx, now + index * 0.15, frequency, 0.4, "triangle");
    });
  },
  beep(ctx, now) {
    [0, 0.2, 0.4].forEach((offset) => {
      playTone(ctx, now + offset, 1000, 0.12, "square");
    });
  },
  alarm(ctx, now) {
    for (let i = 0; i < 4; i += 1) {
      playTone(ctx, now + i * 0.2, i % 2 === 0 ? 600 : 900, 0.18, "sawtooth");
    }
  },
};

function playChime() {
  const ctx = getAudioContext();
  const play = sounds[soundSelect.value] || sounds.bell;
  play(ctx, ctx.currentTime);
}

function goToInterval(index) {
  currentIndex = index;
  remainingSeconds = intervals[currentIndex] * 60;
}

function tick() {
  remainingSeconds -= 1;

  if (remainingSeconds <= 0) {
    playChime();
    goToInterval((currentIndex + 1) % intervals.length);
  }

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
  toggleBtn.textContent = "一時停止";
  intervalId = setInterval(tick, 1000);
}

function pause() {
  if (!isRunning) return;
  isRunning = false;
  toggleBtn.textContent = "再生";
  clearInterval(intervalId);
  intervalId = null;
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

previewBtn.addEventListener("click", () => {
  getAudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  playChime();
});

addIntervalBtn.addEventListener("click", () => {
  intervals.push(DEFAULT_NEW_MINUTES);
  renderIntervalList();
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
});

volumeRange.addEventListener("input", () => {
  volumeValue.textContent = volumeRange.value;
  if (gainNode) {
    gainNode.gain.value = Number(volumeRange.value) / 100;
  }
});

updateDisplay();
renderIntervalList();
