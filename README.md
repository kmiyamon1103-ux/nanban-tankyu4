# 資料を探究！〜南蛮貿易図屏風のひみつを見つけよう〜

高校社会科の授業で使用する、歴史資料探究型の Web 教材です。

## ファイル構成

```
南蛮貿易/
├─ index.html       … メインのHTML
├─ style.css        … スタイル
├─ script.js        … 動作（パスワード/画面遷移/AIテンプレ生成 など）
├─ .nojekyll        … GitHub Pages 用（空ファイル）
├─ README.md        … このファイル
└─ images/
   ├─ sample1.png   … 資料1
   ├─ sample2.png   … 資料2
   └─ title-bg.png  … タイトル/認証画面の背景
```

## パスワード

初期値は `6666` です。`script.js` 冒頭の `PASSWORD` を書き換えれば変更できます。

## ローカルでの開き方

`index.html` をダブルクリックしてブラウザで開けば動作します。

## GitHub Pages で公開する手順

### 1. リポジトリを準備
GitHub で新しいリポジトリを作成し、このフォルダの中身を **すべて** プッシュします。

特に以下が **必ず含まれていること** を確認してください：

- `index.html`
- `style.css`
- `script.js`
- `.nojekyll` （拡張子なしの空ファイル）
- `images/sample1.png`
- `images/sample2.png`
- `images/title-bg.png`

### 2. Git で push する例

```bash
git init
git add .
git commit -m "南蛮貿易教材サイト 初回コミット"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

### 3. GitHub Pages を有効化

1. リポジトリページ → **Settings** → **Pages**
2. **Build and deployment** の **Source** を `Deploy from a branch` に
3. **Branch** を `main` / `/ (root)` に設定して **Save**
4. 数十秒〜1分待つと `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます

### 4. 確認方法

- 公開URL `https://<ユーザー名>.github.io/<リポジトリ名>/` を開く
- 開いたページに画像が表示されていれば成功
- 画像が表示されない場合は、ブラウザで直接画像URLを開いて404か200かを確認：
  - `https://<ユーザー名>.github.io/<リポジトリ名>/images/sample1.png`
  - `https://<ユーザー名>.github.io/<リポジトリ名>/images/title-bg.png`

## 画像が表示されないときのチェックリスト

1. **GitHub のリポジトリページで `images/` フォルダの中に3枚すべてが表示されているか？**
   ない場合は `git add images/` を忘れています。
2. **ファイル名は完全に小文字か？**
   `Sample1.PNG` ではなく `sample1.png` であること。
   GitHub Pages は大文字小文字を区別します。
3. **`.nojekyll` ファイルがリポジトリ直下にあるか？**
   GitHub の Web 上で見えなければ、もう一度 `git add .nojekyll` してください。
4. **ブラウザのキャッシュをクリア**（Ctrl + F5 / Shift + 再読み込み）
5. それでもダメなら、ブラウザの開発者ツール（F12）の **Console / Network** タブを開いて、画像のリクエストが何のステータス（404 / 403 / 200）かを確認してください。

## 画像を差し替える

`images/` フォルダ内の同名ファイルを置き換えるだけで OK です。
別名にしたい場合は `script.js` の `RESOURCES`、`style.css` の `url(...)` を書き換えてください。

## クリックポイントを編集する

`script.js` の `CLICK_POINTS` を編集します。
`x`, `y` は画像内のパーセント位置（0〜100）。画像左上が `(0, 0)`、右下が `(100, 100)`。

```js
{ id: 'ship', name: '船', x: 82, y: 28,
  desc: '遠くから来た大きな船は、多くの人や商品を運んでいました。' },
```
