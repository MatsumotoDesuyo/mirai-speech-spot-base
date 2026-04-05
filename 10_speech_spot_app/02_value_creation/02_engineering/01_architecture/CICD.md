# CI/CD

## 概要

本プロジェクトのCI/CDパイプラインは、**GitHub Actions（CI）** と **Vercel（CD）** の組み合わせで構成する。

- **CI（継続的インテグレーション）:** GitHub Actionsにより、コードの品質を自動検証する
- **CD（継続的デリバリー）:** VercelのGitHub連携により、自動デプロイを行う

## CI: GitHub Actions

### トリガー条件

| イベント | 対象ブランチ | 実行条件 |
|:---|:---|:---|
| `push` | `main` | mainへの直接push時 |
| `pull_request` | `main` | mainへのPR作成・更新時 |

アプリケーションコード（`10_speech_spot_app/02_value_creation/src/`配下）に変更があった場合のみ実行する（`paths`フィルター）。

### 実行ステップ

| # | ステップ | コマンド | 目的 |
|:---|:---|:---|:---|
| 1 | 依存関係インストール | `pnpm install --frozen-lockfile` | 再現可能なインストール |
| 2 | 静的解析 (Lint) | `pnpm lint` | ESLintによるコード品質チェック |
| 3 | 型チェック | `pnpm tsc --noEmit` | TypeScript型安全性の検証 |
| 4 | テスト | `pnpm test` | Vitest（102件）の全テスト実行 |
| 5 | ビルド検証 | `pnpm build` | Next.jsビルドの成功確認 |

### 環境

- **Node.js:** 22.x
- **パッケージマネージャー:** pnpm 10.x
- **作業ディレクトリ:** `10_speech_spot_app/02_value_creation/src`

### 環境変数（CI用）

テストはモック化されているため、外部サービスのシークレットは不要。
ビルド検証ステップでは、Next.jsのビルド時に環境変数の参照が必要となるため、ダミー値を設定する。

### ワークフローファイル

`/.github/workflows/ci.yml`

## CD: Vercel

### デプロイ戦略

| トリガー | デプロイ先 | 説明 |
|:---|:---|:---|
| PRの作成・更新 | Preview | PR毎にプレビュー環境を自動生成 |
| mainブランチへのマージ | Production | 本番環境へ自動デプロイ |

### Vercel設定

- **Root Directory:** `10_speech_spot_app/02_value_creation/src`
- **Framework Preset:** Next.js（自動検出）
- **環境変数:** Vercelダッシュボードで設定（[Deployment.md](./Deployment.md) の環境変数一覧を参照）

### ロールバック

Vercelダッシュボードから、任意の過去デプロイメントへ即座にロールバック可能。

## CI → CD の連携

### Branch Protection Rules（推奨設定）

GitHubリポジトリの `main` ブランチに以下のProtection Rulesを設定し、CIを通過しないコードが本番デプロイされることを防止する。

| 設定項目 | 値 |
|:---|:---|
| Require status checks to pass before merging | 有効 |
| Required status checks | `ci` （GitHub Actionsのジョブ名） |
| Require branches to be up to date before merging | 有効 |

### パイプラインフロー

```
PR作成/更新
    ├─→ GitHub Actions (CI): lint → type-check → test → build
    └─→ Vercel: Preview Deploy
         │
    CI全ステップ成功 → PRマージ可能に
         │
    main マージ
    └─→ Vercel: Production Deploy
```
