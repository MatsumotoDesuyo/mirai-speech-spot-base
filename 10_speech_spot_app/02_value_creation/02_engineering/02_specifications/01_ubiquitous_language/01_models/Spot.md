# Model: Spot

## 概要
演説スポットを表すコアエンティティ。演説場所の位置情報、評価、属性を保持する。

## 識別子
- `id`: UUID（自動生成）

## プロパティ

| プロパティ | 型 | 必須 | 制約 |
|:---|:---|:---:|:---|
| `title` | string | ✅ | 空文字不可 |
| `description` | string | - | |
| `rating` | integer | ✅ | 1〜10の範囲 |
| `bestTime` | integer[] | - | 各要素は8〜19の範囲。昇順ソート済み。 |
| `lat` | float | ✅ | 有効な緯度（-90〜90） |
| `lng` | float | ✅ | 有効な経度（-180〜180） |
| `audienceAttributes` | string[] | - | 許可値: `主婦`, `学生`, `社会人`, `高齢者`, `ファミリー`。定義順でソート済み。 |
| `carAccessibility` | string | ✅ | `allowed` / `brief_stop` / `not_allowed` のいずれか |
| `images` | string[] | - | 画像URLの配列。順序＝表示順序。空配列許容。 |
| `createdAt` | datetime | ✅ | 自動設定 |
| `updatedAt` | datetime | ✅ | 更新時に自動更新 |

## 命名方針
本モデルのプロパティ名は TypeScript の慣習に従い camelCase で記述する。DB層（snake_case）との変換は Interface 層で吸収する。

## 集約境界
`Spot` は集約ルートである。`SpotHistory` は `Spot` の変更に伴い自動生成されるが、独立したエンティティとして管理される。

## ソート規則
- `bestTime`: 保存時に昇順ソートされる。
- `audienceAttributes`: 保存時に定義順（主婦→学生→社会人→高齢者→ファミリー）でソートされる。
