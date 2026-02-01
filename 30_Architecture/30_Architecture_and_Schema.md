# 30_Architecture_and_Schema.md

## 1. Architecture Decisions (ADR Summary)
本プロジェクトでは「48時間以内のデプロイ」を最優先とし、以下の技術的決定を行った。

* **Auth Strategy:**
    * **Decision:** ユーザー管理（Sign Up/Login）を廃止し、**「共有パスコード」**による書き込み制限と、**「環境変数パスワード」**による管理者認証を採用する。
    * **Reason:** 認証基盤の実装・テスト工数をゼロにし、コア機能に集中するため。
* **Map Provider:**
    * **Decision:** **Mapbox** (`react-map-gl/mapbox` v8) を採用。
    * **Reason:** セットアップが容易で、Reactとの親和性が高く、無料枠内で十分なパフォーマンスが得られるため。
    * **Note:** v8では `react-map-gl/mapbox` からインポートする必要がある（`react-map-gl` 直接インポートは非推奨）。
* **Image Storage:**
    * **Decision:** **Cloudflare R2** (S3 Compatible)。
    * **Reason:** 転送量無料であり、ランニングコストを抑えつつS3互換SDKで迅速に実装できるため。
    * **Note:** Public Development URL (`pub-xxx.r2.dev`) を使用。レート制限あり（1000req/10min程度）だが、MVPの規模では問題なし。将来的にはCloudflare Workers経由またはカスタムドメインで対応可能。
* **Map Localization:**
    * **Decision:** マップ読み込み後に全てのテキストラベルを日本語（`name_ja`）優先に動的変更。
    * **Reason:** Mapbox streets-v12スタイルはデフォルトで英語ラベルのため、日本国内での使用に適した表示にするため。

## 2. Tech Stack
* **Frontend:** Next.js 16+ (App Router, Turbopack), React 19, Tailwind CSS, Shadcn/UI, Lucide React
* **Map:** react-map-gl v8, mapbox-gl
* **Backend/DB:** Supabase (PostgreSQL)
* **Storage:** Cloudflare R2 (@aws-sdk/client-s3)
* **Hosting:** Vercel
* **Form Handling:** react-dropzone (画像アップロード)

## 3. Database Schema (Supabase)

### Table: `spots` (Core Data)
掲示板のスポット情報を管理する。画像は配列型で順序を保持する。

| Column | Type | Note |
| :--- | :--- | :--- |
| `id` | `uuid` | PK, Default: `gen_random_uuid()` |
| `title` | `text` | 必須。場所の名称。 |
| `description` | `text` | 任意。補足情報。 |
| `rating` | `int2` | 必須。演説効果のスコア (1-10)で表現。 |
| `best_time` | `int[]` | 任意。時間に対応するIDで表現（8-22）。保存時に昇順ソート。 |
| `lat` | `float8` | 必須 |
| `lng` | `float8` | 必須 |
| `audience_attributes` | `text[]` | 任意。聴衆の属性タグ。保存時に定義順（主婦→学生→社会人→高齢者→ファミリー）でソート。 |
| `car_accessibility` | `text` | 必須。選挙カー利用可否。`allowed`/`brief_stop`/`not_allowed` のいずれか。 |
| `images` | `text[]` | 必須。画像URLの配列。配列の順序＝表示順序。最低1枚必須。 |
| `created_at` | `timestamptz` | Default: `now()` |
| `updated_at` | `timestamptz` | Default: `now()`、更新時自動更新 |

### Table: `spot_history` (Audit Log)
`spots` テーブルへのすべての変更（INSERT/UPDATE/DELETE）を自動的に記録する。

| Column | Type | Note |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `spot_id` | `uuid` | 対象のSpot ID |
| `snapshot` | `jsonb` | その時点での `spots` 行データの完全なコピー |
| `operation` | `text` | 'INSERT', 'UPDATE', 'DELETE' |
| `created_at` | `timestamptz` | 履歴記録日時 |

### Triggers
* `trigger_spots_updated_at`: UPDATE時に`updated_at`を自動更新
* `trigger_spots_history`: INSERT/UPDATE/DELETE時に`spot_history`へスナップショットを自動保存

## 4. API Design (Server Actions)

### `createSpot(formData: FormData)`
新規スポットを作成する。
- パスコード検証
- 画像をR2にアップロード
- 聴衆属性・時間帯をソートしてDB保存

### `updateSpot(formData: FormData)`
既存スポットを更新する。
- パスコード検証
- 既存画像の保持 + 新規画像のアップロード
- 聴衆属性・時間帯をソートしてDB更新

### `deleteSpot(spotId: string, adminPassword: string)`
スポットを物理削除する（管理者のみ）。
- 管理者パスワード検証
- 履歴テーブルには削除前のスナップショットが自動保存される

## 5. Directory Structure (src/src/)
```
src/
├── app/
│   ├── page.tsx           # メインページ（MapView）
│   ├── admin/page.tsx     # 管理画面
│   ├── actions/spot.ts    # Server Actions
│   └── layout.tsx
├── components/
│   ├── map/MapView.tsx    # 地図コンポーネント
│   ├── spot/
│   │   ├── SpotDetailSheet.tsx  # 詳細表示
│   │   └── SpotFormSheet.tsx    # 投稿/編集フォーム
│   └── ui/                # Shadcn/UI
├── lib/
│   ├── constants.ts       # 定数定義
│   ├── supabase/client.ts # Supabaseクライアント
│   └── r2/client.ts       # R2アップロード
└── types/spot.ts          # 型定義
```

## 6. Deployment

### Vercel
- Root Directory: `src`
- 環境変数: `.env.local` と同等の値を設定

### Supabase
- ローカル開発: `npx supabase start`
- 本番: Supabase Cloudでプロジェクト作成、`schema.sql`を実行

### Mapbox
- 本番ドメインをトークンの許可URLに追加

### Cloudflare R2
- Public Development URL使用（カスタムドメイン不要）