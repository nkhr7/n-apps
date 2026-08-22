# n-apps

JavaScriptで作る複数のWebアプリをまとめるリポジトリです。

## 構成

```
.
├── index.html      # トップページ
├── css/style.css   # トップページのスタイル
├── js/script.js    # アプリ一覧を描画するスクリプト
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

## ローカルでの確認方法

`index.html` をブラウザで直接開くか、簡易サーバーで確認できます。

```sh
npx serve .
```
