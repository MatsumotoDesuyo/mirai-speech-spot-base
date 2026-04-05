# Model: SpotHistory

## 概要
`Spot` の変更履歴を記録する監査ログエンティティ。Spot の INSERT / UPDATE / DELETE 時に自動生成される。

## 識別子
- `id`: UUID（自動生成）

## プロパティ

| プロパティ | 型 | 必須 | 制約 |
|:---|:---|:---:|:---|
| `spotId` | UUID | ✅ | 対象の Spot ID |
| `snapshot` | JSON | ✅ | 変更時点での Spot データの完全コピー |
| `operation` | string | ✅ | `INSERT` / `UPDATE` / `DELETE` のいずれか |
| `createdAt` | datetime | ✅ | 自動設定 |

## 不変条件
- SpotHistory は書き込み専用（Append Only）。更新・削除はされない。
- snapshot には変更時点での Spot の完全なデータが含まれる。
