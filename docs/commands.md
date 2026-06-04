# bookshelf-app コマンドリファレンス

プロジェクトルートで実行することを前提としています。

---

## 開発サーバー

```bash
# 起動
npm run dev

# 起動（ポート指定）
npm run dev -- --port 3001

# 停止
Ctrl + C

# バックグラウンドで起動
npm run dev &

# バックグラウンドプロセスを停止
kill $(lsof -ti :3000)
```

---

## ビルド / 本番起動

```bash
# 型チェック → ビルド
npm run build

# 本番サーバー起動（要: 事前に build）
npm run start

# ビルド成果物を削除してクリーンビルド
rm -rf .next && npm run build
```

---

## 型チェック / Lint

```bash
# TypeScript 型チェック（コンパイルはしない）
npx tsc --noEmit

# ESLint
npm run lint

# ESLint 自動修正
npm run lint -- --fix
```

---

## Git

```bash
# 現在の状態確認
git status

# 変更の差分確認
git diff

# ステージングされた差分確認
git diff --staged

# すべての変更をステージング
git add .

# ファイルを指定してステージング
git add components/AddBookModal.jsx utils/googleBooksApi.ts

# コミット
git commit -m "feat: Google Books API を utils に切り出し"

# add + commit を一括（追跡済みファイルのみ）
git commit -am "fix: SearchResultCard の参照パスを修正"

# リモートへプッシュ
git push

# ブランチを作成して切り替え
git checkout -b feature/google-books-refactor

# ブランチの一覧
git branch -a

# 直前のコミットを取り消し（変更は残す）
git reset --soft HEAD~1

# 直前のコミットのメッセージを修正
git commit --amend -m "feat: Google Books API ユーティリティを追加"

# コミット履歴を確認
git log --oneline -10

# 特定ファイルの変更履歴
git log --oneline -- components/AddBookModal.jsx
```

### コミットメッセージのプレフィックス規則

| プレフィックス | 用途 |
|---|---|
| `feat:` | 新機能の追加 |
| `fix:` | バグ修正 |
| `refactor:` | 動作を変えないコード整理 |
| `style:` | UI スタイルの変更 |
| `docs:` | ドキュメント更新 |
| `chore:` | 設定・依存関係の更新 |

---

## 依存パッケージ

```bash
# パッケージ追加
npm install <package-name>

# 開発用パッケージ追加
npm install -D <package-name>

# パッケージ削除
npm uninstall <package-name>

# node_modules を再インストール
rm -rf node_modules && npm install

# インストール済みパッケージ一覧（直接依存のみ）
npm list --depth=0

# 古いパッケージを確認
npm outdated
```

---

## Supabase

```bash
# Supabase CLI のインストール（初回のみ）
npm install -g supabase

# ログイン
supabase login

# プロジェクトとリンク（初回のみ・PROJECT_ID は管理画面で確認）
supabase link --project-ref <PROJECT_ID>

# ローカル DB を起動（Docker が必要）
supabase start

# ローカル DB を停止
supabase stop

# マイグレーションを本番に適用
supabase db push

# 現在のスキーマを差分確認
supabase db diff

# TypeScript の型を自動生成
supabase gen types typescript --linked > types/supabase.ts

# 環境変数の確認（ローカル起動時の接続先）
supabase status
```

---

## 環境変数

`.env.local` に以下を設定します（`.gitignore` に含まれているため Git には含まれません）。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx...
```

```bash
# 環境変数ファイルの存在確認
ls -la .env*

# 設定されている変数名の一覧（値は表示しない）
cat .env.local | cut -d= -f1
```

---

## よく使う作業フロー

### 機能開発の一連の流れ

```bash
# 1. ブランチを作成
git checkout -b feature/my-feature

# 2. 開発サーバーを起動して実装
npm run dev

# 3. 型チェック・Lint を通す
npx tsc --noEmit && npm run lint

# 4. コミット
git add .
git commit -m "feat: ○○機能を追加"

# 5. main にマージ
git checkout main
git merge feature/my-feature

# 6. リモートへプッシュ
git push
```

### 問題が起きたときのリセット

```bash
# node_modules と .next をすべて削除して再インストール
rm -rf node_modules .next && npm install

# Git の変更をすべて破棄（未コミットの変更が消えるため注意）
git checkout .
git clean -fd
```