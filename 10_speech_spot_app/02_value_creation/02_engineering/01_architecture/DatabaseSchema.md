# Database Schema (Supabase)

## Table: `spots`（コアデータ）
演説スポット情報を管理する。

| Column | Type | Note |
|:---|:---|:---|
| `id` | `uuid` | PK, Default: `gen_random_uuid()` |
| `title` | `text` | 必須。場所の名称。 |
| `description` | `text` | 任意。補足情報。 |
| `rating` | `int2` | 必須。演説効果のスコア (1-10)。 |
| `best_time` | `int[]` | 任意。時間に対応するID（8-19）。保存時に昇順ソート。 |
| `lat` | `float8` | 必須。緯度。 |
| `lng` | `float8` | 必須。経度。 |
| `audience_attributes` | `text[]` | 任意。聴衆の属性タグ。保存時に定義順でソート。 |
| `car_accessibility` | `text` | 必須。`allowed` / `brief_stop` / `not_allowed`。 |
| `images` | `text[]` | 任意。画像URLの配列。配列の順序＝表示順序。空配列も許容。 |
| `created_at` | `timestamptz` | Default: `now()` |
| `updated_at` | `timestamptz` | Default: `now()`、更新時自動更新 |

## Table: `spot_history`（監査ログ）
`spots` テーブルへの全変更（INSERT/UPDATE/DELETE）を自動記録。

| Column | Type | Note |
|:---|:---|:---|
| `id` | `uuid` | PK |
| `spot_id` | `uuid` | 対象のSpot ID |
| `snapshot` | `jsonb` | その時点での `spots` 行データの完全コピー |
| `operation` | `text` | `'INSERT'` / `'UPDATE'` / `'DELETE'` |
| `created_at` | `timestamptz` | 履歴記録日時 |

## Table: `api_keys`（APIキー管理）
外部APIアクセス用のAPIキーを管理する。

| Column | Type | Note |
|:---|:---|:---|
| `id` | `uuid` | PK, Default: `gen_random_uuid()` |
| `app_name` | `text` | 必須。利用アプリ名。 |
| `api_key_hash` | `text` | 必須。UNIQUE。APIキーのSHA-256ハッシュ。 |
| `api_key_prefix` | `text` | 必須。キーの先頭13文字（`mssb_` + 8文字）。一覧表示用。 |
| `is_active` | `boolean` | 必須。Default: `true`。有効/無効フラグ。 |
| `created_at` | `timestamptz` | Default: `now()` |
| `updated_at` | `timestamptz` | Default: `now()`、更新時自動更新 |

## Table: `api_access_logs`（API利用ログ・レート制限）
APIアクセスをイベントログとして記録する。レート制限の集計元となる。

| Column | Type | Note |
|:---|:---|:---|
| `id` | `uuid` | PK, Default: `gen_random_uuid()` |
| `api_key_id` | `uuid` | 必須。FK → `api_keys.id`。 |
| `accessed_at` | `timestamptz` | Default: `now()`。アクセス日時。 |
| `response_status` | `int2` | 必須。HTTPレスポンスステータス。 |
| `ip_address` | `text` | 任意。リクエスト元IPアドレス。 |

## Triggers
- `trigger_spots_updated_at`: UPDATE時に`updated_at`を自動更新。
- `trigger_spots_history`: INSERT/UPDATE/DELETE時に`spot_history`へスナップショットを自動保存。
