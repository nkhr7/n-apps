const PREFECTURES = [
  ["北海道", "hokkaido"], ["青森県", "aomori"], ["岩手県", "iwate"], ["宮城県", "miyagi"],
  ["秋田県", "akita"], ["山形県", "yamagata"], ["福島県", "fukushima"], ["茨城県", "ibaraki"],
  ["栃木県", "tochigi"], ["群馬県", "gunma"], ["埼玉県", "saitama"], ["千葉県", "chiba"],
  ["東京都", "tokyo"], ["神奈川県", "kanagawa"], ["新潟県", "niigata"], ["富山県", "toyama"],
  ["石川県", "ishikawa"], ["福井県", "fukui"], ["山梨県", "yamanashi"], ["長野県", "nagano"],
  ["岐阜県", "gifu"], ["静岡県", "shizuoka"], ["愛知県", "aichi"], ["三重県", "mie"],
  ["滋賀県", "shiga"], ["京都府", "kyoto"], ["大阪府", "osaka"], ["兵庫県", "hyogo"],
  ["奈良県", "nara"], ["和歌山県", "wakayama"], ["鳥取県", "tottori"], ["島根県", "shimane"],
  ["岡山県", "okayama"], ["広島県", "hiroshima"], ["山口県", "yamaguchi"], ["徳島県", "tokushima"],
  ["香川県", "kagawa"], ["愛媛県", "ehime"], ["高知県", "kochi"], ["福岡県", "fukuoka"],
  ["佐賀県", "saga"], ["長崎県", "nagasaki"], ["熊本県", "kumamoto"], ["大分県", "oita"],
  ["宮崎県", "miyazaki"], ["鹿児島県", "kagoshima"], ["沖縄県", "okinawa"],
].map(([kanji, romaji], index) => ({
  kanji,
  romaji,
  code: String(index + 1).padStart(2, "0"),
}));

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

function getPrefOptions(format) {
  return PREFECTURES.map((pref) => [pref[format], pref.kanji]);
}

function renderPrefSelect() {
  const format = document.querySelector('input[name="prefValueFormat"]:checked').value;
  renderSelect("prefPreview", "prefCode", getPrefOptions(format));
}

function renderAll() {
  renderPrefSelect();

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

document.querySelectorAll('input[name="prefValueFormat"]').forEach((radio) => {
  radio.addEventListener("change", renderPrefSelect);
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
