# Node.js 実行環境ポリシー (Node.js Environment Policy)

## 1. 目的
このドキュメントは、`tools/` 配下の全ツールで使用する Node.js および パッケージマネージャーの標準構成を定義します。

バージョン管理ツール・パッケージマネージャーの選定方針を明文化し、環境差異による問題を防ぎ、セットアップ手順を統一することが目的です。

---

## 2. Node.js バージョン管理: nvm

### 採用ツール
[nvm (Node Version Manager)](https://github.com/coreybutler/nvm-windows) を使用します。

### バージョン指定
プロジェクトルートに `.nvmrc` ファイルを配置し、使用するバージョンを明示します。

```
# .nvmrc
22.22.0
```

### セットアップ手順

```bash
# .nvmrc に記載されたバージョンをインストール
nvm install 22.22.0

# バージョンを切り替える
nvm use 22.22.0

# 確認
node --version  # → v22.22.0
```

### バージョンアップグレードポリシー
- **採用バージョン**: Node.js **Active LTS** を採用する。
- 現在採用バージョン: **v22.22.0** (2027年4月まで Active LTS)
- 次世代 LTS への移行タイミング: 新バージョンが Active LTS に昇格し、かつ主要ライブラリの対応が確認できた段階で行う。

---

## 3. パッケージマネージャー: pnpm

### 採用理由
npm に代わり **pnpm** を標準とします。

| 観点 | npm | pnpm |
| :--- | :--- | :--- |
| ディスク効率 | パッケージをプロジェクトごとにコピー | コンテントアドレスストアで共有 |
| インストール速度 | 標準 | 高速（キャッシュ再利用） |
| モノレポ対応 | `workspaces` フィールドで対応 | `pnpm-workspace.yaml` で対応 |
| セキュリティ | フラット構造（幽霊依存が発生しやすい） | 厳格な依存解決（幽霊依存を防止） |

### バージョン
- 採用バージョン: **pnpm v10.30.3** 以降
- `package.json` の `packageManager` フィールドで固定されています。

### インストール
```bash
npm install -g pnpm
pnpm --version  # → 10.30.3
```

### npm / yarn の使用禁止
`.npmrc` に `only-allow=pnpm` を設定しており、`npm install` や `yarn` を実行するとエラーになります。

---

## 4. モノレポ構成: pnpm Workspaces

ワークスペースの定義はプロジェクトルートの `pnpm-workspace.yaml` で行います。

```yaml
# pnpm-workspace.yaml
packages:
  - "tools/*"
```

### 依存関係の追加
```bash
# ルートの devDependencies に追加
pnpm add -D <package> -w

# 特定ツールの dependencies に追加
pnpm add <package> --filter <tool-name>
```

### コマンドの実行
```bash
# 特定ツールのスクリプトを実行
pnpm --filter build-context run build

# ルートの package.json に定義された集約コマンドを実行（推奨）
pnpm run build:context
```

---

## 5. 管理ファイル一覧

| ファイル | 役割 |
| :--- | :--- |
| `.nvmrc` | Node.js バージョンを指定 |
| `pnpm-workspace.yaml` | ワークスペースパッケージを定義 |
| `.npmrc` | `only-allow=pnpm` と `engine-strict=true` を設定 |
| `package.json` | `packageManager`・`engines`・スクリプトを定義 |
| `pnpm-lock.yaml` | 依存関係のロックファイル（**必ずコミットする**） |

> `package-lock.json` は使用しません。リポジトリに含まれている場合は削除してください。

---

## 6. 初回セットアップ手順（開発者向け）

```bash
# 1. Node.js バージョンを合わせる
nvm install 22.22.0
nvm use 22.22.0

# 2. pnpm をグローバルインストール
npm install -g pnpm

# 3. 依存関係をインストール（pnpm-lock.yaml を元に再現）
pnpm install
```
