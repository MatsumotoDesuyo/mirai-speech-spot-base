# ADR-001: DDD（ドメイン駆動設計）アーキテクチャの採用

## ステータス

**採用** — 2026-04-05

## コンテキスト

Speech Spot アプリケーションは、Server Actions / API Routes にビジネスロジック・バリデーション・データアクセスが混在する構造で開発されていた。具体的には:

- `app/actions/spot.ts` にパスコード検証、フォームパース、バリデーション、ソートロジック、R2アップロード、Supabase操作が一体化
- `app/api/v1/spots/route.ts` にAPIキー検証、レート制限、ログ記録、GeoJSON構築が一体化
- ビジネスルール（公職選挙法に基づく時間帯制約、聴衆属性の定義順ソート等）がコード内にインラインで実装

この構造では:

1. **AI駆動開発との相性が悪い** — AIにコンテキストを渡す際、関心事が混在しているためプロンプトが肥大化し、変更の影響範囲の特定が困難
2. **仕様変更時の影響が不明確** — ビジネスルール変更がどのファイルに影響するか特定しにくい
3. **テスタビリティが低い** — 外部サービス（Supabase, R2）との結合が密で、テスト時に複雑なモック構築が必要

## 決定

戦術的DDDパターンを採用し、以下の4層アーキテクチャに移行する。

```
src/
  app/              ← Presentation層 (Next.js App Router)
  application/      ← Application層 (Use Cases)
  domain/           ← Domain層 (Models, Value Objects, Repository Interface)
  infrastructure/   ← Infrastructure層 (Repository実装, Storage実装)
```

### 各層の責務

| 層 | 責務 | 依存先 |
|:---|:---|:---|
| Presentation | FormData パース、HTTP レスポンス構築、エラー → ApiResponse 変換 | Application |
| Application | ユースケースのオーケストレーション、認証チェック | Domain |
| Domain | ビジネスルール、バリデーション、ソートロジック、Repository インターフェース | なし（自己完結） |
| Infrastructure | Supabase / R2 との通信、DB レコード ↔ ドメインモデル変換 | Domain |

### 依存方向

```
Presentation → Application → Domain ← Infrastructure
```

Domain 層は他のどの層にも依存しない（依存性逆転の原則）。

### 導入したドメインモデル

| 種別 | クラス | 仕様根拠 |
|:---|:---|:---|
| Value Object | `Rating` | R-SV-02: 推奨Lv 1〜10 |
| Value Object | `Location` | R-SV-04: 緯度経度 |
| Value Object | `CarAccessibility` | R-SV-03: 選挙カー3値 |
| Value Object | `BestTime` | R-SV-05: 8〜19 + 昇順ソート |
| Value Object | `AudienceAttributes` | R-SV-06: 定義順ソート |
| Value Object | `ApiKeyValue` | APIキー生成・SHA-256ハッシュ |
| Entity | `Spot` | 集約ルート |
| Use Case | `CreateSpotUseCase` 他6件 | UC-CS, UC-US, UC-DS, UC-GA, APIキー管理 |
| Repository IF | `ISpotRepository` 他3件 | DB/Storage 抽象化 |

## 結果

### ポジティブ

- **ビジネスルールが仕様と1:1対応** — Value Object の `create()` メソッドが各ルールIDに直結
- **テスト品質の向上** — Domain層は外部依存ゼロで高速テスト可能。構造テスト54件を新規追加
- **リファクタリングの安全性** — 事前に実装した行動テスト48件が移行前後で全てグリーン（振る舞い不変を証明）
- **AI駆動開発との親和性** — 各層が小さく自己完結しているため、AIへのコンテキスト提供が容易

### ネガティブ

- **ファイル数の増加** — 3ファイルから約20ファイルへ増加
- **間接層の増加** — Server Action → UseCase → Repository → Supabase という呼び出しチェーン
- **現時点では過剰設計の側面** — ドメインが小規模（Spot + ApiKey の2集約）であり、DDDの恩恵が最大化されるのはドメインが成長した後

### テスト結果

| 種別 | 件数 | 結果 |
|:---|:---|:---|
| 行動テスト | 48 | 全合格（DDD移行前後で変化なし） |
| 構造テスト | 54 | 全合格（DDD移行後に新規追加） |
| **合計** | **102** | **全合格** |
