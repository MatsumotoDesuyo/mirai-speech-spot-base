# Tech Stack

## フロントエンド
- **フレームワーク:** Next.js 16+ (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS, Shadcn/UI, Lucide React
- **地図:** react-map-gl v8, mapbox-gl
- **フォーム:** react-dropzone（画像アップロード）

## バックエンド / データベース
- **BaaS:** Supabase (PostgreSQL)

## ストレージ
- **画像保存:** Cloudflare R2 (@aws-sdk/client-s3)
  - 転送量無料。Public Development URL使用。
  - レート制限あり（1000req/10min程度）。MVP規模では問題なし。

## ホスティング
- **デプロイ先:** Vercel

## 主要なアーキテクチャ決定

### 認証戦略
ユーザー管理（Sign Up/Login）を廃止し、「共有パスコード」による書き込み制限と「環境変数パスワード」による管理者認証を採用。認証基盤の実装・テスト工数をゼロにし、コア機能に集中するため。

### 地図プロバイダー
Mapbox (`react-map-gl/mapbox` v8) を採用。セットアップが容易で、Reactとの親和性が高く、無料枠内で十分なパフォーマンス。v8では `react-map-gl/mapbox` からインポートする（`react-map-gl` 直接インポートは非推奨）。

### 画像ストレージ
Cloudflare R2 (S3 Compatible)。転送量無料でランニングコストを抑えつつS3互換SDKで迅速に実装可能。

### 地図の日本語化
マップ読み込み後に全テキストラベルを日本語（`name_ja`）優先に動的変更。Mapbox streets-v12スタイルはデフォルトで英語ラベルのため。
