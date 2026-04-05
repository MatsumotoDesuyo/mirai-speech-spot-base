# Model: ApiKey

## 概要
外部API利用者の認証に使用するAPIキーエンティティ。

## 識別子
- `id`: UUID（自動生成）

## プロパティ

| プロパティ | 型 | 必須 | 制約 |
|:---|:---|:---:|:---|
| `appName` | string | ✅ | 利用アプリ名。空文字不可。 |
| `keyHash` | string | ✅ | APIキーのSHA-256ハッシュ値（平文は保存しない） |
| `keyPrefix` | string | ✅ | キーの先頭13文字（`mssb_` + 8文字）。一覧表示用。 |
| `isActive` | boolean | ✅ | デフォルト: `true` |
| `createdAt` | datetime | ✅ | 自動設定 |
| `updatedAt` | datetime | ✅ | 更新時に自動更新 |

## 関連エンティティ: ApiAccessLog
APIキーごとのアクセスをイベントログとして記録する。レート制限はこのログの集計によって実現される。

| プロパティ | 型 | 必須 | 制約 |
|:---|:---|:---:|:---|
| `id` | UUID | ✅ | 自動生成 |
| `apiKeyId` | UUID | ✅ | 対象の ApiKey ID |
| `accessedAt` | datetime | ✅ | 自動設定。アクセス日時。 |
| `responseStatus` | integer | ✅ | HTTPレスポンスステータス（200, 401, 429 等） |
| `ipAddress` | string | - | リクエスト元IPアドレス |

## キー生成ルール
- フォーマット: `mssb_` + 64文字のランダム hex（`randomBytes(32)`）
- ハッシュ: SHA-256 で一方向ハッシュ化して `keyHash` に保存
- `keyPrefix`: 先頭13文字（`mssb_` + 8文字）を保存

## 不変条件
- APIキーの平文は発行時に1回だけ表示され、以降は復元不可能。
- `keyHash` は一方向ハッシュで保存される。
- `ApiAccessLog` は書き込み専用（Append Only）。更新・削除はされない。
