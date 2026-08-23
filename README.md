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
├── privacy/           # プライバシーポリシー
└── apps/
    ├── interval-timer/     # 複数の間隔をループするインターバルタイマー
    ├── youtube-thumbnail/  # YouTube URLから全サイズのサムネイルを表示
    └── roulette/            # 項目を登録してランダムに1つ選ぶルーレット
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

## プライバシーポリシー

`privacy/index.html` に、小規模サイト向けのプライバシーポリシーテンプレートを設置しています。お問い合わせ先メールアドレスは迷惑メール収集ボット対策のため、HTMLに平文で書かずJavaScriptで組み立てて表示しています。
