# UseCase: GetSpotsApi

## 概要
外部アプリが演説スポットデータを一括取得する。

## アクター
API Consumer（外部アプリ開発者）

## 事前条件
- 有効なAPIキーが発行されている。

---

## 正常系

### UC-GA-01: 全スポットデータをGeoJSON形式で取得できる
- **Given:** 有効かつアクティブなAPIキーが `X-API-Key` ヘッダーに指定されている
- **When:** `GET /api/v1/spots` にリクエストする
- **Then:**
  - GeoJSON `FeatureCollection` 形式で全スポットが返却される
  - 座標は GeoJSON 準拠で `[経度, 緯度]` の順（DB の `lng`, `lat` と順序が逆であることに注意）
  - メタデータ（帰属表示、ライセンス、生成日時、総件数）が含まれる
  - `Cache-Control: no-store` ヘッダーが付与される

---

## 異常系

### UC-GA-E01: APIキーが未指定の場合
- **Given:** `X-API-Key` ヘッダーが存在しない
- **When:** `GET /api/v1/spots` にリクエストする
- **Then:** 401 `INVALID_API_KEY` が返却される

### UC-GA-E02: APIキーが無効な場合
- **Given:** 存在しないAPIキーが指定されている
- **When:** `GET /api/v1/spots` にリクエストする
- **Then:** 401 `INVALID_API_KEY` が返却される

### UC-GA-E03: APIキーが無効化されている場合
- **Given:** `isActive = false` のAPIキーが指定されている
- **When:** `GET /api/v1/spots` にリクエストする
- **Then:** 403 `API_KEY_DISABLED` が返却される

### UC-GA-E04: 日次リクエスト上限を超過した場合
- **Given:** 当日すでに10回リクエストしたAPIキーが指定されている
- **When:** `GET /api/v1/spots` にリクエストする
- **Then:** 429 `RATE_LIMIT_EXCEEDED` が返却される
