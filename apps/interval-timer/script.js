const timeDisplay = document.getElementById("timeDisplay");
const nextChimeDisplay = document.getElementById("nextChime");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const previewBtn = document.getElementById("previewBtn");
const intervalSelect = document.getElementById("intervalSelect");
const soundSelect = document.getElementById("soundSelect");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");

let elapsedSeconds = 0;
let isRunning = false;
let intervalId = null;
let audioContext = null;
let gainNode = null;

function getIntervalSeconds() {
  return Number(intervalSelect.value) * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(elapsedSeconds);
  const intervalSeconds = getIntervalSeconds();
  const remaining = intervalSeconds - (elapsedSeconds % intervalSeconds);
  nextChimeDisplay.textContent = `次の音まで ${formatTime(remaining)}`;
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

function tick() {
  elapsedSeconds += 1;
  updateDisplay();

  if (elapsedSeconds % getIntervalSeconds() === 0) {
    playChime();
  }
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
  elapsedSeconds = 0;
  updateDisplay();
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

intervalSelect.addEventListener("change", updateDisplay);

volumeRange.addEventListener("input", () => {
  volumeValue.textContent = volumeRange.value;
  if (gainNode) {
    gainNode.gain.value = Number(volumeRange.value) / 100;
  }
});

updateDisplay();
