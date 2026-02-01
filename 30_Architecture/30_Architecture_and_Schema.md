# 30_Architecture_and_Schema.md

## 1. Architecture Decisions (ADR Summary)
本プロジェクトでは「48時間以内のデプロイ」を最優先とし、以下の技術的決定を行った。

* **Auth Strategy:**
    * **Decision:** ユーザー管理（Sign Up/Login）を廃止し、**「共有パスコード」**による書き込み制限と、**「環境変数パスワード」**による管理者認証を採用する。
    * **Reason:** 認証基盤の実装・テスト工数をゼロにし、コア機能に集中するため。
* **Map Provider:**
    * **Decision:** **Mapbox** (`react-map-gl`) を採用。
    * **Reason:** セットアップが容易で、Reactとの親和性が高く、無料枠内で十分なパフォーマンスが得られるため。
* **Image Storage:**
    * **Decision:** **Cloudflare R2** (S3 Compatible)。
    * **Reason:** 転送量無料であり、ランニングコストを抑えつつS3互換SDKで迅速に実装できるため。

## 2. Tech Stack
* **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Shadcn/UI, Lucide React
* **Map:** react-map-gl, mapbox-gl
* **Backend/DB:** Supabase (PostgreSQL)
* **Storage:** Cloudflare R2 (@aws-sdk/client-s3)
* **Hosting:** Vercel

## 3. Database Schema (Supabase)

### Table: `spots` (Core Data)
掲示板のスポット情報を管理する。画像は配列型で順序を保持する。

| Column | Type | Note |
| :--- | :--- | :--- |
| `id` | `uuid` | PK, Default: `gen_random_uuid()` |
| `title` | `text` | 必須。場所の名称。 |
| `description` | `text` | 任意。補足情報。 |
| `rating` | `int2` | 必須。演説効果のスコア (1-10)で表現。 |
| `best_time` | `int[]` | 任意。時間に対応するIDで表現 |
| `lat` | `float8` | 必須 |
| `lng` | `float8` | 必須 |
| `audience_attributes` | `text[]` | 任意。聴衆の属性タグ。UIでの選択肢推奨: ["主婦", "学生", "社会人", "高齢者", "ファミリー"] |
| `images` | `text[]` | 画像URLの配列。配列の順序＝表示順序とする。 |
| `created_at` | `timestamptz` | Default: `now()` |
| `updated_at` | `timestamptz` | Default: `now()` |

### Table: `spot_history` (Audit Log)
`spots` テーブルへのすべての変更（INSERT/UPDATE）を自動的に記録する。
削除時のデータも残すため、アプリケーション側での削除処理は物理削除ではなく、履歴を残した上での削除（またはアーカイブ）が望ましいが、今回はシンプルに「削除直前の状態」もこのテーブルに残るようにTriggerを設定する。

| Column | Type | Note |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `spot_id` | `uuid` | 対象のSpot ID |
| `snapshot` | `jsonb` | その時点での `spots` 行データの完全なコピー |
| `operation` | `text` | 'INSERT', 'UPDATE', 'DELETE' |
| `created_at` | `timestamptz` | 履歴記録日時 |