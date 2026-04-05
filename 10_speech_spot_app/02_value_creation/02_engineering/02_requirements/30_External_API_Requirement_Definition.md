# 30_External_API_Requirement_Definition.md

## 1. Introduction
* **Project:** みらい街頭演説Base - 外部API連携機能
* **Version:** 1.0
* **Goal:** 演説スポットBaseのデータを外部アプリケーションに読み取り専用で提供するAPIを構築し、演説場所情報のエコシステムを拡大する。
* **Core Value:** 演説場所データのオープン化により、複数アプリが同一の高品質なスポットデータを活用でき、政治活動全体の効率を底上げする。

## 2. User Roles
* **API Consumer (外部アプリ開発者):**
    * APIキーを使用し、サーバーサイドからスポットデータを取得する。
    * 取得したデータを自身のDBにコピーして利用する。
    * **Auth:** APIキー認証（リクエストヘッダー `X-API-Key`）。
* **API Admin (Mission Owner/Dev):**
    * APIキーの発行・管理・失効操作を行う。
    * APIの利用状況をモニタリングする。
    * **Auth:** API管理専用パスコード（既存の投稿パスコードとは別）。

## 3. 方針・制約
* **読み取り専用:** 外部アプリには読み取り権限のみを提供する。書き込み・更新・削除は一切許可しない。
* **レート制限:** APIキーごとに1日最大10回のアクセスを許可する。
* **データコピー前提:** 外部アプリは自身のDBにデータをコピーして利用するモデルとする。毎回のAPIアクセスは想定しない。
* **サーバー間通信のみ:** ブラウザからの直接アクセスは想定しない。CORS設定は不要。
* **レスポンスキャッシュなし:** 各APIコールで最新データを返却する。`Cache-Control: no-store` を付与。
* **ライセンス:** AGPL-3.0。外部利用者はライセンス条件に従う。

## 4. Key Features

### 4.1. スポットデータ取得API

* **Endpoint:** `GET /api/v1/spots`
* **認証:** `X-API-Key` ヘッダー必須。
* **レスポンス形式:** GeoJSON (`FeatureCollection`)
* **レスポンスボディ:**
    ```json
    {
      "type": "FeatureCollection",
      "metadata": {
        "attribution": "演説スポットBase",
        "license": "AGPL-3.0",
        "license_url": "https://github.com/<owner>/<repo>/blob/main/LICENSE",
        "generated_at": "2026-04-05T12:00:00Z",
        "total_count": 42
      },
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [139.7447, 35.6762]
          },
          "properties": {
            "id": "uuid-...",
            "title": "国会議事堂前",
            "description": "広い歩道あり。選挙カーは...",
            "rating": 8,
            "best_time": [10, 11, 12],
            "audience_attributes": ["社会人"],
            "car_accessibility": "not_allowed",
            "images": [
              "https://bucket.r2.dev/spots/1234-photo.jpg"
            ],
            "created_at": "2026-03-01T09:00:00Z",
            "updated_at": "2026-03-15T14:30:00Z"
          }
        }
      ]
    }
    ```
* **全件一括返却:** 全スポットデータを1レスポンスで返す。フィルタリング・ページネーションは現バージョンでは不要。
* **画像URL:** R2のエグレスは無料のため、`images` フィールドをそのまま含める。外部アプリには自身のストレージへのコピーを推奨する。

### 4.2. エラーレスポンス

* **形式:** JSON
    ```json
    {
      "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Daily API limit (10 requests) exceeded. Try again tomorrow."
      }
    }
    ```
* **エラーコード一覧:**

    | HTTP Status | Code | 説明 |
    |---|---|---|
    | 401 | `INVALID_API_KEY` | APIキーが無効または未指定 |
    | 403 | `API_KEY_DISABLED` | APIキーが無効化されている |
    | 429 | `RATE_LIMIT_EXCEEDED` | 1日のアクセス上限（10回）超過 |
    | 500 | `INTERNAL_ERROR` | サーバー内部エラー |

### 4.3. APIキー管理ページ

* **URL:** `/admin/api-keys`
* **認証:** API管理専用パスコード（環境変数 `API_ADMIN_PASSCODE`、32文字以上のランダム文字列）。
* **機能一覧:**
    1. **キー発行:**
        * アプリ名（必須）を入力し、パスコード認証後にAPIキーを生成。
        * 生成されたAPIキーは **発行時に1回だけ** 画面に表示される（コピー用）。
        * DB にはAPIキーの **SHA-256ハッシュ** を保存する（平文は保存しない）。
        * 発行時に利用規約（AGPL-3.0ライセンス条件、帰属表示義務）を表示する。
    2. **キー一覧:**
        * 発行済みキーの一覧表示（アプリ名、作成日、有効/無効状態、本日のアクセス数）。
        * APIキーの平文は表示不可（ハッシュのみ保存のため）。キープレフィックス（先頭8文字）のみ表示。
    3. **キー無効化:**
        * 不正利用や契約終了時にキーを無効化できる。
        * 無効化は論理削除（`is_active = false`）。

### 4.4. 利用規約・帰属表示

* **3層での実施:**
    1. **APIキー発行時:** 利用規約を画面に表示し、管理者が確認した上で発行。
    2. **APIレスポンス:** `metadata.attribution` と `metadata.license` をレスポンスに含める。
    3. **リポジトリ:** LICENSEファイルをAGPL-3.0に更新。
* **利用規約の主旨:**
    * データの出典として「演説スポットBase」のクレジット表示が必要。
    * AGPL-3.0ライセンスに準拠すること。
    * データの再配布時もライセンス条件を維持すること。

## 5. Database Schema

### 5.1. `api_keys` テーブル（APIキー管理）

| Column | Type | Constraints | 説明 |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | 主キー |
| `app_name` | TEXT | NOT NULL | 利用アプリ名 |
| `api_key_hash` | TEXT | NOT NULL, UNIQUE | APIキーのSHA-256ハッシュ |
| `api_key_prefix` | TEXT | NOT NULL | キーの先頭8文字（一覧表示用） |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | 有効/無効フラグ |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 作成日時 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 更新日時 |

### 5.2. `api_access_logs` テーブル（利用ログ・レート制限）

| Column | Type | Constraints | 説明 |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | 主キー |
| `api_key_id` | UUID | NOT NULL, FK → `api_keys.id` | APIキーへの参照 |
| `accessed_at` | TIMESTAMPTZ | DEFAULT NOW() | アクセス日時 |
| `response_status` | SMALLINT | NOT NULL | HTTPレスポンスステータス |
| `ip_address` | TEXT | | リクエスト元IPアドレス |

### 5.3. レート制限ロジック
* `api_access_logs` から当日のアクセス数をカウント。
* UTC基準で日付を区切る（`accessed_at >= CURRENT_DATE`）。
* 成功レスポンス（200）のみをカウント対象とする。
* 10回以上の場合は429を返却。

## 6. Security

### 6.1. APIキーのセキュリティ
* APIキーは64文字のランダム文字列（`crypto.randomBytes(32).toString('hex')`）で生成。
* DBにはSHA-256ハッシュのみを保存。平文は発行時に1回だけ表示。
* リクエスト時はハッシュ化して照合。
* プレフィックス `mssb_` を付与し、誤ってcommitされた際にSecret Scanningで検知可能にする。

### 6.2. API管理パスコード
* 環境変数 `API_ADMIN_PASSCODE` に設定。
* 既存の `PASSCODE`（投稿用）、`ADMIN_PASSWORD`（削除用）とは独立。
* 32文字以上のランダム文字列を推奨。

### 6.3. RLS ポリシー
* `api_keys` テーブル: SELECTのみ許可（サーバーサイドからの読み取り用）。INSERT/UPDATE はServer Actions経由。
* `api_access_logs` テーブル: INSERT/SELECT のみ許可。

## 7. Environment Variables（追加分）

| 変数名 | 用途 | 例 |
|---|---|---|
| `API_ADMIN_PASSCODE` | API管理ページの認証パスコード | 32文字以上のランダム文字列 |

## 8. Implementation Notes

* **APIバージョニング:** `/api/v1/spots` のパスにバージョンを含める。将来の破壊的変更時に `/api/v2/spots` を追加可能。
* **Next.js Route Handler:** `app/api/v1/spots/route.ts` に実装。Server Actionsではなく Route Handler を使用（外部HTTP呼び出しのため）。
* **APIキー管理:** `app/admin/api-keys/page.tsx` および対応するServer Actions。
* **タイムゾーン:** レート制限の日付区切りはUTC基準。
* **将来の拡張性:** フィルタリング（bbox, rating等）、差分取得（`updated_since`）は将来バージョンで検討。
