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
