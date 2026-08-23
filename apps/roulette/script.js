const STORAGE_KEY = "roulette:items";
const COLORS = ["#3b5bfd", "#ff6b6b", "#ffb648", "#2ec4b6", "#a06cd5", "#ff8fab", "#4caf50", "#f4a259"];
const MIN_ITEMS_TO_SPIN = 2;
const SPIN_EXTRA_TURNS = 5;

const wheelSvg = document.getElementById("wheelSvg");
const wheelSlices = document.getElementById("wheelSlices");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");
const itemForm = document.getElementById("itemForm");
const itemInput = document.getElementById("itemInput");
const itemList = document.getElementById("itemList");
const clearItemsBtn = document.getElementById("clearItemsBtn");

let items = loadItems();
let currentRotation = 0;
let isSpinning = false;

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch (error) {
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // localStorageが使えない場合は保存をあきらめる
  }
}

function polarPoint(angleDeg, radius) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: 100 + radius * Math.cos(angleRad),
    y: 100 + radius * Math.sin(angleRad),
  };
}

function renderWheel() {
  wheelSlices.innerHTML = "";

  if (items.length === 0) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "100");
    text.setAttribute("y", "100");
    text.setAttribute("class", "wheel-empty-text");
    text.textContent = "項目を追加してください";
    wheelSlices.appendChild(text);
    return;
  }

  const sliceAngle = 360 / items.length;

  items.forEach((item, index) => {
    const startAngle = -90 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    if (items.length === 1) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "100");
      circle.setAttribute("cy", "100");
      circle.setAttribute("r", "94");
      circle.setAttribute("fill", COLORS[index % COLORS.length]);
      wheelSlices.appendChild(circle);
    } else {
      const start = polarPoint(startAngle, 94);
      const end = polarPoint(endAngle, 94);
      const d = `M 100 100 L ${start.x} ${start.y} A 94 94 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
      path.setAttribute("d", d);
      path.setAttribute("fill", COLORS[index % COLORS.length]);
      wheelSlices.appendChild(path);
    }

    const labelPos = polarPoint(midAngle, 60);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(labelPos.x));
    text.setAttribute("y", String(labelPos.y));
    text.setAttribute("class", "wheel-slice-text");
    text.setAttribute("transform", `rotate(${midAngle + 90}, ${labelPos.x}, ${labelPos.y})`);
    text.textContent = item;
    wheelSlices.appendChild(text);
  });
}

function renderItemList() {
  itemList.innerHTML = "";

  if (items.length === 0) {
    const hint = document.createElement("li");
    hint.className = "empty-hint";
    hint.textContent = "まだ項目がありません";
    itemList.appendChild(hint);
  }

  items.forEach((item, index) => {
    const row = document.createElement("li");
    row.className = "item-row";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = COLORS[index % COLORS.length];

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";
    removeBtn.dataset.index = String(index);
    removeBtn.setAttribute("aria-label", "削除");

    row.append(swatch, name, removeBtn);
    itemList.appendChild(row);
  });

  spinBtn.disabled = items.length < MIN_ITEMS_TO_SPIN || isSpinning;
}

function render() {
  renderWheel();
  renderItemList();
}

function addItem(rawValue) {
  const value = rawValue.trim();
  if (!value) return;

  items.push(value);
  saveItems();
  render();
}

function removeItem(index) {
  items.splice(index, 1);
  saveItems();
  render();
}

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(itemInput.value);
  itemInput.value = "";
  itemInput.focus();
});

itemList.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.matches(".remove-btn")) return;
  removeItem(Number(target.dataset.index));
});

clearItemsBtn.addEventListener("click", () => {
  if (items.length === 0) return;
  if (!window.confirm("登録した項目をすべて削除しますか？")) return;

  items = [];
  saveItems();
  render();
  resultText.textContent = "";
});

spinBtn.addEventListener("click", () => {
  if (isSpinning || items.length < MIN_ITEMS_TO_SPIN) return;

  const winnerIndex = Math.floor(Math.random() * items.length);
  const sliceAngle = 360 / items.length;
  const winnerMidAngle = -90 + winnerIndex * sliceAngle + sliceAngle / 2;

  const base = Math.floor(currentRotation / 360) * 360;
  const desiredMod = (((-90 - winnerMidAngle) % 360) + 360) % 360;
  let nextRotation = base + SPIN_EXTRA_TURNS * 360 + desiredMod;
  if (nextRotation <= currentRotation) {
    nextRotation += 360;
  }
  currentRotation = nextRotation;

  isSpinning = true;
  spinBtn.disabled = true;
  resultText.textContent = "";
  wheelSvg.style.transform = `rotate(${currentRotation}deg)`;

  wheelSvg.addEventListener(
    "transitionend",
    () => {
      isSpinning = false;
      spinBtn.disabled = items.length < MIN_ITEMS_TO_SPIN;
      resultText.textContent = items[winnerIndex];
    },
    { once: true }
  );
});

render();
