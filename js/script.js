// 新しいアプリを追加する際は、このリストに1件追加するだけでトップページに表示されます
const apps = [
  {
    name: "インターバルタイマー",
    description: "好きな間隔・音で鳴らせるインターバルタイマー",
    url: "apps/interval-timer/",
  },
  {
    name: "YouTubeサムネイル抽出",
    description: "URLを入力すると全サイズのサムネイルを表示",
    url: "apps/youtube-thumbnail/",
  },
  {
    name: "ルーレット",
    description: "項目を登録してランダムに1つ選ぶルーレット",
    url: "apps/roulette/",
  },
  {
    name: "selectタグ生成",
    description: "都道府県・年・月・日のselectタグをコピー",
    url: "apps/select-generator/",
  },
];

function renderApps() {
  const container = document.getElementById("app-list");

  apps.forEach((app) => {
    const isComingSoon = !app.url;
    const card = document.createElement(isComingSoon ? "div" : "a");

    card.className = "app-card" + (isComingSoon ? " coming-soon" : "");
    if (!isComingSoon) {
      card.href = app.url;
    }

    const title = document.createElement("h2");
    title.textContent = app.name;

    const desc = document.createElement("p");
    desc.textContent = app.description;

    card.append(title, desc);
    container.appendChild(card);
  });
}

renderApps();
