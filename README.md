# n-apps

JavaScriptで作る複数のWebアプリをまとめるリポジトリです。

## 構成

```
.
├── index.html        # トップページ
├── 404.html          # GitHub Pagesが自動的に使うカスタム404ページ
├── favicon.png       # 全ページ共通のfavicon
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
    ├── roulette/            # 項目を登録してランダムに1つ選ぶルーレット
    └── select-generator/    # 都道府県・年・月・日のselectタグを生成してコピー
```

## 新しいアプリの追加方法

1. `apps/` 配下にアプリごとのディレクトリを作成します（例: `apps/todo/`）。
2. `js/script.js` の `apps` 配列に、アプリ名・説明・パスを追加します。

```js
{
  name: "アプリ名",
  description: "簡単な説明",
  url: "apps/todo/",
}
```

3. 新しいアプリのページにも、既存ページと同じ開閉メニュー（`css/header.css` / `js/header.js` を読み込み、`<header class="site-nav">` のマークアップをコピー）と、favicon（`<link rel="icon" type="image/png" href="/favicon.png">`）を追加します。
4. 追加した新しいページへのリンクを、`index.html` と既存の各アプリページの `#navMenu` にも追加します（メニューのリンクは各ページにハードコードしているため、手動での同期が必要です）。
5. サイト内リンクは `index.html` を含めず、末尾スラッシュ付きのディレクトリURL（例: `apps/todo/`）で統一してください。`index.html` に直接アクセスされた場合は、各ページの `<head>` に設置したスクリプトでディレクトリURLへ自動的にリダイレクトされます（`index.html`とディレクトリURLの2つのURLが併存しないようにするためです）。

## ローカルでの確認方法

`index.html` をブラウザで直接開くか、簡易サーバーで確認できます。

```sh
npx serve .
```

## プライバシーポリシー

`privacy/index.html` に、小規模サイト向けのプライバシーポリシーテンプレートを設置しています。お問い合わせ先メールアドレスは迷惑メール収集ボット対策のため、HTMLに平文で書かずJavaScriptで組み立てて表示しています。

## 404ページ

`404.html` をリポジトリ直下に置くと、GitHub Pagesが存在しないURLへのアクセス時に自動的にこのページを表示します（追加の設定ファイルは不要です）。このページでは、6秒後に自動的にトップページへリダイレクトします（`<meta http-equiv="refresh">` と JavaScript の両方で実装しているため、JavaScriptが無効な環境でも動作します）。

404ページはどのURL階層からアクセスされるか分からないため、他のページと異なりナビゲーションリンクはすべて `/apps/interval-timer/` のような絶対パスで記述しています。新しいアプリを追加した際は、`404.html` の `#navMenu` にもリンクを追加してください。また、Google AdSenseのポリシー上、コンテンツのないエラーページに広告を掲載すべきではないため、`404.html` のフッターには広告を含めていません。
