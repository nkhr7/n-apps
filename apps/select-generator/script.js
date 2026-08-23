const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const YEAR_SPAN = 80;

function buildOptionsHTML(options) {
  return options
    .map(([value, label]) => `  <option value="${value}">${label}</option>`)
    .join("\n");
}

function buildSelectHTML(id, options) {
  return `<select id="${id}" name="${id}">\n${buildOptionsHTML(options)}\n</select>`;
}

function renderSelect(previewId, codeId, options) {
  const preview = document.getElementById(previewId);
  const code = document.getElementById(codeId);

  preview.innerHTML = "";
  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    preview.appendChild(option);
  });

  code.textContent = buildSelectHTML(previewId.replace("Preview", ""), options);
}

function getYearOptions(order) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < YEAR_SPAN; i += 1) {
    years.push(currentYear - i);
  }
  if (order === "asc") {
    years.reverse();
  }
  return years.map((year) => [String(year), `${year}年`]);
}

function renderYearSelect() {
  const order = document.querySelector('input[name="yearOrder"]:checked').value;
  renderSelect("yearPreview", "yearCode", getYearOptions(order));
}

function renderAll() {
  renderSelect(
    "prefPreview",
    "prefCode",
    PREFECTURES.map((pref) => [pref, pref])
  );

  renderYearSelect();

  renderSelect(
    "monthPreview",
    "monthCode",
    Array.from({ length: 12 }, (_, i) => [String(i + 1), `${i + 1}月`])
  );

  renderSelect(
    "dayPreview",
    "dayCode",
    Array.from({ length: 31 }, (_, i) => [String(i + 1), `${i + 1}日`])
  );
}

document.querySelectorAll('input[name="yearOrder"]').forEach((radio) => {
  radio.addEventListener("change", renderYearSelect);
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "コピーしました";
    } catch (error) {
      button.textContent = "コピー失敗";
    }
    setTimeout(() => {
      button.textContent = "コピー";
    }, 1500);
  });
});

renderAll();
