# n-apps

JavaScriptで作る複数のWebアプリをまとめるリポジトリです。

## 構成

```
.
├── index.html        # トップページ
├── css/
│   ├── style.css     # トップページのスタイル
│   └── header.css     # 全ページ共通の開閉メニュー用スタイル
├── js/
│   ├── script.js      # アプリ一覧を描画するスクリプト
│   └── header.js      # 全ページ共通の開閉メニュー用スクリプト
├── privacy/           # プライバシーポリシー（AdSense審査用）
└── apps/
    ├── interval-timer/     # 複数の間隔をループするインターバルタイマー
    └── youtube-thumbnail/  # YouTube URLから全サイズのサムネイルを表示
```

## 新しいアプリの追加方法

1. `apps/` 配下にアプリごとのディレクトリを作成します（例: `apps/todo/`）。
2. `js/script.js` の `apps` 配列に、アプリ名・説明・パスを追加します。

```js
{
  name: "アプリ名",
  description: "簡単な説明",
  url: "apps/todo/index.html",
}
```

3. 新しいアプリのページにも、既存ページと同じ開閉メニュー（`css/header.css` / `js/header.js` を読み込み、`<header class="site-nav">` のマークアップをコピー）を追加します。
4. 追加した新しいページへのリンクを、`index.html` と既存の各アプリページの `#navMenu` にも追加します（メニューのリンクは各ページにハードコードしているため、手動での同期が必要です）。

## ローカルでの確認方法

`index.html` をブラウザで直接開くか、簡易サーバーで確認できます。

```sh
npx serve .
```

## Google Analytics（GA4）

全ページの `<head>` に、測定ID `G-V08S2K6KE4` のgtag.jsスニペットを設置済みです。新しいアプリページを追加する際は、`<meta charset>` の直後に同じスニペットをコピーしてください。

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V08S2K6KE4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-V08S2K6KE4');
</script>
```

## Google AdSense（審査後に設置予定）

現時点ではパブリッシャーID未取得のため未設置です。審査に通過してID（`ca-pub-`から始まるID）が発行されたら、以下を対応してください。

1. 各ページの `<head>` に確認用スニペットを追加
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
2. リポジトリ直下に `ads.txt` を作成し、Google側の指示内容（`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` の形式）を記載
3. 広告を表示したい箇所に `<ins class="adsbygoogle">` タグと `(adsbygoogle = window.adsbygoogle || []).push({});` を追加

パブリッシャーIDが分かったら教えてください。上記を実装します。

## プライバシーポリシー

`privacy/index.html` に、AdSense審査用の小規模サイト向けテンプレートを設置しています。実際に運用する際は、以下を確認・編集してください。

- 「お問い合わせ」セクションの連絡先（現在は `[お問い合わせ先メールアドレスをご記入ください]` のプレースホルダーです）
