# Rule: Authentication

## 概要
書き込み操作および管理操作における認証ルール。

## 認証シークレット一覧

本システムでは、用途別に3つの独立したシークレットを使用する。それぞれ異なる環境変数で管理され、混同してはならない。

| 環境変数 | 用途 | 使用箇所 |
|:---|:---|:---|
| `PASSCODE` | スポット投稿・編集の共有パスコード | Server Action: `createSpot`, `updateSpot` |
| `ADMIN_PASSWORD` | 管理者によるスポット削除 | Server Action: `deleteSpot` |
| `API_ADMIN_PASSCODE` | APIキー管理ページの認証（32文字以上推奨） | Server Action: `createApiKey`, `listApiKeys`, `toggleApiKey` |

## ルール

### R-AU-01: スポット投稿・編集にはパスコードが必要
- `createSpot` および `updateSpot` の実行には、`PASSCODE` と一致するパスコードの提供が必須。
- パスコードが不正な場合、操作は拒否される。

### R-AU-02: スポット削除には管理者パスワードが必要
- `deleteSpot` の実行には、`ADMIN_PASSWORD` と一致する管理者パスワードの提供が必須。
- パスワードが不正な場合、操作は拒否される。

### R-AU-03: 閲覧に認証は不要
- スポットの一覧表示、詳細表示、地図表示には認証を必要としない。

### R-AU-04: API利用にはAPIキーが必要
- 外部APIエンドポイント（`GET /api/v1/spots`）へのアクセスには、有効な `X-API-Key` ヘッダーが必須。
- APIキーは SHA-256 ハッシュで DB 内の `api_key_hash` と照合される。
- APIキーが無効または未指定の場合、401を返却。
- APIキーが無効化されている場合、403を返却。

### R-AU-05: APIキー管理には専用パスコードが必要
- `/admin/api-keys` でのキー発行・一覧取得・有効/無効切替には、`API_ADMIN_PASSCODE` と一致するパスコードが必須。
