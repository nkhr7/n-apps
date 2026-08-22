const THUMBNAIL_TYPES = [
  { file: "maxresdefault.jpg", name: "最大解像度 (maxresdefault)", width: 1280, height: 720 },
  { file: "sddefault.jpg", name: "標準画質 (sddefault)", width: 640, height: 480 },
  { file: "hqdefault.jpg", name: "高画質 (hqdefault)", width: 480, height: 360 },
  { file: "mqdefault.jpg", name: "中画質 (mqdefault)", width: 320, height: 180 },
  { file: "default.jpg", name: "標準 (default)", width: 120, height: 90 },
  { file: "0.jpg", name: "フレーム 0", width: 120, height: 90 },
  { file: "1.jpg", name: "フレーム 1", width: 120, height: 90 },
  { file: "2.jpg", name: "フレーム 2", width: 120, height: 90 },
  { file: "3.jpg", name: "フレーム 3", width: 120, height: 90 },
];

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

const form = document.getElementById("thumbnailForm");
const urlInput = document.getElementById("urlInput");
const errorMessage = document.getElementById("errorMessage");
const resultArea = document.getElementById("resultArea");
const videoIdText = document.getElementById("videoIdText");
const thumbnailGrid = document.getElementById("thumbnailGrid");

function extractVideoId(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let url;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch (error) {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    const match = url.pathname.match(/^\/(embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[2];
  }

  return null;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultArea.hidden = true;
}

function createThumbnailCard(videoId, type) {
  const card = document.createElement("div");
  card.className = "thumbnail-card";

  const frame = document.createElement("div");
  frame.className = "thumb-frame";

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = type.name;
  img.src = `https://img.youtube.com/vi/${videoId}/${type.file}`;

  img.addEventListener("load", () => {
    const isPlaceholder =
      img.naturalWidth === 120 &&
      img.naturalHeight === 90 &&
      (type.width !== 120 || type.height !== 90);

    if (isPlaceholder) {
      card.classList.add("unavailable");
      frame.textContent = "この動画では利用できません";
    }
  });

  img.addEventListener("error", () => {
    card.classList.add("unavailable");
    frame.textContent = "読み込みに失敗しました";
  });

  frame.appendChild(img);

  const label = document.createElement("div");
  label.className = "thumb-label";

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = type.name;

  const size = document.createElement("span");
  size.className = "size";
  size.textContent = `${type.width}×${type.height}`;

  label.append(name, size);

  const actions = document.createElement("div");
  actions.className = "thumb-actions";

  const openLink = document.createElement("a");
  openLink.className = "btn";
  openLink.href = img.src;
  openLink.target = "_blank";
  openLink.rel = "noopener";
  openLink.textContent = "開く";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "btn";
  copyBtn.textContent = "URLコピー";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(img.src);
      copyBtn.textContent = "コピーしました";
    } catch (error) {
      copyBtn.textContent = "コピー失敗";
    }
    setTimeout(() => {
      copyBtn.textContent = "URLコピー";
    }, 1500);
  });

  actions.append(openLink, copyBtn);

  card.append(frame, label, actions);
  return card;
}

function renderThumbnails(videoId) {
  videoIdText.textContent = videoId;
  thumbnailGrid.innerHTML = "";

  THUMBNAIL_TYPES.forEach((type) => {
    thumbnailGrid.appendChild(createThumbnailCard(videoId, type));
  });

  errorMessage.hidden = true;
  resultArea.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const videoId = extractVideoId(urlInput.value);
  if (!videoId) {
    showError("YouTubeのURL、またはビデオIDを正しく入力してください。");
    return;
  }

  renderThumbnails(videoId);
});
