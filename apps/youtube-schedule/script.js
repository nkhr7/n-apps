const STORAGE_KEY = "youtube-schedule:settings";
const CACHE_KEY = "youtube-schedule:lastResult";
const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/;
const HANDLE_PATTERN = /^@[\w.-]+$/;
const API_BASE = "https://www.googleapis.com/youtube/v3";

const channelInput = document.getElementById("channelInput");
const apiKeyInput = document.getElementById("apiKeyInput");
const toggleApiKeyBtn = document.getElementById("toggleApiKeyBtn");
const intervalSelect = document.getElementById("intervalSelect");
const saveBtn = document.getElementById("saveBtn");
const refreshBtn = document.getElementById("refreshBtn");
const statusText = document.getElementById("statusText");
const errorMessage = document.getElementById("errorMessage");
const streamList = document.getElementById("streamList");

let settings = loadSettings();
let refreshTimer = null;
let isChecking = false;

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      channelInput: typeof parsed.channelInput === "string" ? parsed.channelInput : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      intervalMinutes: typeof parsed.intervalMinutes === "number" ? parsed.intervalMinutes : 10,
      resolvedChannelId: typeof parsed.resolvedChannelId === "string" ? parsed.resolvedChannelId : null,
      resolvedForInput: typeof parsed.resolvedForInput === "string" ? parsed.resolvedForInput : null,
      uploadsPlaylistId: typeof parsed.uploadsPlaylistId === "string" ? parsed.uploadsPlaylistId : null,
    };
  } catch (error) {
    return { channelInput: "", apiKey: "", intervalMinutes: 10, resolvedChannelId: null, resolvedForInput: null, uploadsPlaylistId: null };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // localStorageが使えない場合は保存をあきらめる
  }
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, fetchedAt: Date.now() }));
  } catch (error) {
    // localStorageが使えない場合は保存をあきらめる
  }
}

function parseChannelInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (CHANNEL_ID_PATTERN.test(trimmed)) return { type: "id", value: trimmed };
  if (HANDLE_PATTERN.test(trimmed)) return { type: "handle", value: trimmed };

  let url;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch (error) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "channel" && parts[1]) return { type: "id", value: parts[1] };
  if (parts[0] && parts[0].startsWith("@")) return { type: "handle", value: parts[0] };
  if (parts[0] === "c" && parts[1]) return { type: "custom", value: parts[1] };
  if (parts[0] === "user" && parts[1]) return { type: "username", value: parts[1] };
  return null;
}

async function apiRequest(path, params) {
  const url = new URL(`${API_BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("key", settings.apiKey);

  const response = await fetch(url.toString());
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = data?.error?.errors?.[0]?.reason;
    const message = data?.error?.message || `HTTPエラー (${response.status})`;
    const error = new Error(message);
    error.reason = reason;
    throw error;
  }

  return data;
}

async function resolveChannelId(parsed) {
  if (parsed.type === "id") return parsed.value;

  if (parsed.type === "handle") {
    const data = await apiRequest("channels", { part: "id", forHandle: parsed.value });
    if (data.items && data.items[0]) return data.items[0].id;
    throw new Error("指定したハンドルのチャンネルが見つかりませんでした。");
  }

  if (parsed.type === "username") {
    const data = await apiRequest("channels", { part: "id", forUsername: parsed.value });
    if (data.items && data.items[0]) return data.items[0].id;
    throw new Error("指定したユーザー名のチャンネルが見つかりませんでした。");
  }

  // "c" のカスタムURLはAPIで直接解決できないため検索で代用する（クォータ消費が大きい）
  const data = await apiRequest("search", { part: "snippet", type: "channel", q: parsed.value, maxResults: 1 });
  if (data.items && data.items[0]) return data.items[0].id.channelId;
  throw new Error("チャンネルが見つかりませんでした。/channel/ または /@ハンドル 形式のURLをお試しください。");
}

async function getUploadsPlaylistId(channelId) {
  const data = await apiRequest("channels", { part: "contentDetails", id: channelId });
  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("アップロード一覧の取得に失敗しました。");
  return uploads;
}

async function getRecentVideoIds(playlistId) {
  const data = await apiRequest("playlistItems", {
    part: "contentDetails",
    playlistId,
    maxResults: 15,
  });
  return (data.items || []).map((item) => item.contentDetails.videoId);
}

async function getLiveAndUpcoming(videoIds) {
  if (videoIds.length === 0) return [];

  const data = await apiRequest("videos", {
    part: "snippet,liveStreamingDetails",
    id: videoIds.join(","),
  });

  return (data.items || [])
    .filter((video) => video.snippet.liveBroadcastContent === "live" || video.snippet.liveBroadcastContent === "upcoming")
    .map((video) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || "",
      status: video.snippet.liveBroadcastContent,
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime || null,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "live" ? -1 : 1;
      return new Date(a.scheduledStartTime || 0) - new Date(b.scheduledStartTime || 0);
    });
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderStreams(items) {
  streamList.innerHTML = "";

  if (items.length === 0) {
    const hint = document.createElement("li");
    hint.className = "empty-hint";
    hint.textContent = "現在、配信中・配信予定の動画はありません。";
    streamList.appendChild(hint);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("li");

    const link = document.createElement("a");
    link.className = "stream-card";
    link.href = `https://www.youtube.com/watch?v=${item.id}`;
    link.target = "_blank";
    link.rel = "noopener";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (item.thumbnail) {
      const img = document.createElement("img");
      img.src = item.thumbnail;
      img.alt = item.title;
      img.loading = "lazy";
      thumb.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "stream-info";

    const badge = document.createElement("span");
    badge.className = "badge" + (item.status === "live" ? " live" : "");
    badge.textContent = item.status === "live" ? "配信中" : "配信予定";

    const title = document.createElement("p");
    title.className = "stream-title";
    title.textContent = item.title;

    const time = document.createElement("p");
    time.className = "stream-time";
    time.textContent = item.scheduledStartTime ? formatDateTime(item.scheduledStartTime) : "";

    info.append(badge, title, time);
    link.append(thumb, info);
    card.appendChild(link);
    streamList.appendChild(card);
  });
}

function setStatus(text) {
  statusText.textContent = text;
  statusText.hidden = !text;
}

function setError(text) {
  errorMessage.textContent = text;
  errorMessage.hidden = !text;
}

function errorMessageFor(error) {
  if (error.reason === "quotaExceeded" || error.reason === "dailyLimitExceeded") {
    return "YouTube Data APIの利用上限に達しました。しばらく時間をおいてから再度お試しください。";
  }
  if (error.reason === "keyInvalid" || error.reason === "badRequest") {
    return "APIキーが正しくないか、YouTube Data API v3が有効になっていない可能性があります。";
  }
  return `取得に失敗しました: ${error.message}`;
}

async function checkNow() {
  if (isChecking) return;
  if (!settings.apiKey) {
    setError("YouTube Data APIキーを入力して保存してください。");
    return;
  }
  const parsed = parseChannelInput(settings.channelInput);
  if (!parsed) {
    setError("チャンネルURLまたはハンドルを正しく入力して保存してください。");
    return;
  }

  isChecking = true;
  refreshBtn.disabled = true;
  setError("");
  setStatus("確認中...");

  try {
    if (!settings.resolvedChannelId || settings.resolvedForInput !== settings.channelInput) {
      const channelId = await resolveChannelId(parsed);
      settings.resolvedChannelId = channelId;
      settings.resolvedForInput = settings.channelInput;
      settings.uploadsPlaylistId = await getUploadsPlaylistId(channelId);
      saveSettings();
    }

    const videoIds = await getRecentVideoIds(settings.uploadsPlaylistId);
    const items = await getLiveAndUpcoming(videoIds);

    renderStreams(items);
    saveCache(items);
    setStatus(`最終更新: ${new Date().toLocaleTimeString("ja-JP")}`);
  } catch (error) {
    setError(errorMessageFor(error));
    const cached = loadCache();
    if (cached) {
      renderStreams(cached.items);
      setStatus(`最終更新: ${new Date(cached.fetchedAt).toLocaleTimeString("ja-JP")}（取得エラーのため前回の情報を表示中）`);
    }
  } finally {
    isChecking = false;
    refreshBtn.disabled = false;
  }
}

function restartAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (settings.intervalMinutes > 0) {
    refreshTimer = setInterval(checkNow, settings.intervalMinutes * 60 * 1000);
  }
}

function applySettingsToForm() {
  channelInput.value = settings.channelInput;
  apiKeyInput.value = settings.apiKey;
  intervalSelect.value = String(settings.intervalMinutes);
}

toggleApiKeyBtn.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleApiKeyBtn.textContent = isPassword ? "隠す" : "表示";
});

saveBtn.addEventListener("click", () => {
  const newChannelInput = channelInput.value.trim();
  if (newChannelInput !== settings.channelInput) {
    settings.resolvedChannelId = null;
    settings.resolvedForInput = null;
    settings.uploadsPlaylistId = null;
  }
  settings.channelInput = newChannelInput;
  settings.apiKey = apiKeyInput.value.trim();
  settings.intervalMinutes = Number(intervalSelect.value);
  saveSettings();
  restartAutoRefresh();
  checkNow();
});

refreshBtn.addEventListener("click", checkNow);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && settings.channelInput && settings.apiKey) {
    checkNow();
  }
});

applySettingsToForm();

const cached = loadCache();
if (cached) {
  renderStreams(cached.items);
  setStatus(`最終更新: ${new Date(cached.fetchedAt).toLocaleTimeString("ja-JP")}`);
}

if (settings.channelInput && settings.apiKey) {
  restartAutoRefresh();
  checkNow();
}
