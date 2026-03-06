# デフォルト・ツール・アーキテクチャ (Default Tool Architecture)

## 1. 目的
このドキュメントは、本プロジェクト内で開発される全ての内部ツールが準拠すべき、標準的なアーキテクチャを定義します。

このデフォルトアーキテクチャの目的は、ツール開発の一貫性を保ち、セットアップにかかる時間を短縮し、C2Vの設計思想（関心の分離、メンテナンス性）をツール開発においても維持することです。

## 2. 基本構成: pnpm Workspaces
ツール開発は、**pnpm Workspaces**を利用したモノレポ形式で管理します。これにより、プロジェクト全体の一元管理と、各ツールの独立性を両立します。

> Node.js バージョン管理・パッケージマネージャーの詳細は [`node_environment.md`](./node_environment.md) を参照してください。

### ディレクトリ構成
```plaintext
[project-root]/
├── .nvmrc                      # ★Node.js バージョン指定
├── .npmrc                      # ★pnpm 強制設定 (only-allow=pnpm)
├── pnpm-workspace.yaml         # ★ワークスペース定義
├── pnpm-lock.yaml              # ★依存関係ロックファイル
├── tools/
│   ├── docs/                   # ツール全般に関するドキュメント
│   │   ├── default_tool_architecture.md  # 本ファイル
│   │   ├── node_environment.md           # Node.js/pnpm 環境ポリシー
│   │   └── tool_development_policy.md
│   └── [ツール名]/             (例: build-context)
│       ├── src/
│       │   └── main.ts         # メインの処理を記述するエントリーポイント
│       ├── docs/               # (推奨) ツール固有のドキュメント・仕様書
│       ├── config.json         # (推奨) ツールの設定ファイル
│       └── package.json        # ★ツール固有の名前とスクリプトを定義
└── package.json                # ★プロジェクト全体管理用のルートpackage.json
```

## 3. 技術スタック
- **実行環境**: Node.js v22.22.0 (Active LTS) ※ `.nvmrc` で管理
- **パッケージマネージャー**: pnpm v10.30.3 以降
- **開発言語**: TypeScript

## 4. 依存関係の管理
- 全てのツールの依存関係は、プロジェクトルートの`package.json`に`devDependencies`として**一元管理**します。
- プロジェクト開始時には、ルートディレクトリで一度だけ`pnpm install`を実行します。
- 特定のツールにのみ新しい依存関係を追加する場合は、ルートディレクトリから以下のコマンドを実行します。
  ```bash
  # 例: 'chalk'を'build-context'ツールに追加する場合
  pnpm add chalk --filter build-context

  # ルートの devDependencies に追加する場合
  pnpm add -D <package> -w
  ```
- **`npm install` は使用禁止**です。`.npmrc` の `only-allow=pnpm` により実行時にエラーになります。

## 5. コマンドの実行: チェインアプローチ
ユーザーの使いやすさを最優先し、全てのツールコマンドはプロジェクトルートから実行できるようにします。その際、ルートの`package.json`は各ツールの`package.json`に処理を**移譲（チェイン）**します。

#### ルートの `package.json`
ユーザーが直接実行する、分かりやすいコマンド名を定義します。
```json
{
  "name": "orchestration-monorepo",
  "private": true,
  "packageManager": "pnpm@10.30.3",
  "engines": { "node": ">=22.22.0", "pnpm": ">=10.0.0" },
  "scripts": {
    "build:context": "pnpm --filter build-context run build"
  },
  "devDependencies": {}
}
```

> `workspaces` フィールドは pnpm では使用しません。`pnpm-workspace.yaml` で定義します。

#### ツールの `package.json`
ツールの内部的な実行コマンドを定義します。
```json
{
  "name": "build-context",
  "version": "1.0.0",
  "scripts": {
    "build:context": "ts-node ./src/main.ts"
  }
}
```

## 6. 基本的な設計思想
- **設定の外部化**: スクリプト内に設定値をハードコーディングせず、`config.json`ファイルに分離することを**強く推奨します**。ただし、スクリプトが極めてシンプルである場合に限り、開発者の判断でハードコーディングを許容します。
- **単一責任の原則**: `main.ts`は処理全体の流れを制御する役割に徹し、再利用可能な具体的な処理は、別ファイル（例: `utils.ts`）に関数として切り出すことを推奨します。
- **明確なエントリーポイント**: ツールの実行は、必ず`pnpm scripts`を通じて行います。
- **意図を明確にするコメント**: 全ての**クラス**と**パブリックメソッド**には、その**責務（何をするためのものか）**を簡潔に説明するコメントを必ず記述する。

## 7. 成果物の出力 (Artifact Output)
ツールが何らかのファイルを生成する場合、**原則として**、その成果物はツール自身のルートディレクトリ配下にある `dist/` ディレクトリに出力することを**強く推奨します**。これにより、各ツールが自己完結し、成果物の管理が容易になります。

## 8. ドキュメント管理

### ツール全般のドキュメント
`tools/docs/` に配置する。

### ツール固有のドキュメント
`tools/[ツール名]/docs/` に配置する。各ツールには最低限以下を含めること：
- `specification.md`: ツールの仕様書

### ADR (Architecture Decision Records)
ツールの設計に関する重要な技術的意思決定は、ADRとして記録する。
- ツール固有のADR → `tools/[ツール名]/docs/adr/`
- ツール横断のADR → `tools/docs/adr/`
