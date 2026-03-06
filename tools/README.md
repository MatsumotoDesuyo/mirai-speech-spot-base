# Tools

## 概要
このディレクトリは、C2Vオーケストレーションプロジェクトの価値創造・価値届出を支援・自動化するためのコマンドラインツール群を格納します。

本プロジェクトの基本思想・運営原則については [00_C2V/](../00_C2V/) を参照してください。

## ツール一覧

| ツール | 目的 | コマンド |
| :--- | :--- | :--- |
| [build-context](build-context/) | 役割別コンテキストファイルの自動生成 | `npm run build:context` |
| [sync-knowledge](sync-knowledge/) | コンテキストファイルの外部プロジェクトへの同期 | `npm run sync-knowledge` |

上記を一括実行: `npm run deliver:context`

## 開発規約
ツールの開発に関する規約・ポリシーは以下を参照してください。

- [デフォルトアーキテクチャ](docs/default_tool_architecture.md) — ツール開発の標準構成
- [ツール開発ポリシー](docs/tool_development_policy.md) — 開発プロセス・品質基準

### ツール間の情報共有
あるツールが別のツールの成果物（例: ファイルパス）を参照する必要がある場合、その情報は [tool-config.json](tool-config.json) を介して共有されます。ツールは他のツールのディレクトリパスをハードコーディングするべきではありません。

### 新しいツールの追加方法
1. `tools/` 配下に新しいディレクトリを作成
2. `docs/default_tool_architecture.md` に従って構成
3. ルートの `package.json` にnpmスクリプトを追加
4. 必要に応じて `tool-config.json` を更新