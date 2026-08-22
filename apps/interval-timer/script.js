const CHIME_INTERVAL_SECONDS = 5 * 60;

const timeDisplay = document.getElementById("timeDisplay");
const nextChimeDisplay = document.getElementById("nextChime");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");

let elapsedSeconds = 0;
let isRunning = false;
let intervalId = null;
let audioContext = null;
let gainNode = null;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(elapsedSeconds);
  const remaining = CHIME_INTERVAL_SECONDS - (elapsedSeconds % CHIME_INTERVAL_SECONDS);
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

function playChime() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [880, 1320].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);

    const startTime = now + index * 0.18;
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.35);
  });
}

function tick() {
  elapsedSeconds += 1;
  updateDisplay();

  if (elapsedSeconds % CHIME_INTERVAL_SECONDS === 0) {
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

volumeRange.addEventListener("input", () => {
  volumeValue.textContent = volumeRange.value;
  if (gainNode) {
    gainNode.gain.value = Number(volumeRange.value) / 100;
  }
});

updateDisplay();
