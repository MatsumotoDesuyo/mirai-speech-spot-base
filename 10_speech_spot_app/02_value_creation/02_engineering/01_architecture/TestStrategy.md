# Test Strategy

## 1. 目的

本ドキュメントは、Speech Spot アプリケーションにおけるテスト戦略を定義する。
DDD（ドメイン駆動設計）への移行を前提とし、リファクタリング前後でプロダクトの振る舞いが保証されるテスト体系を構築する。

## 2. テスト方針

### 2.1. 2層テストアーキテクチャ

テストを**振る舞いテスト**と**構造テストの**2層に分離し、リファクタリング耐性と設計品質の両方を担保する。

| 層 | 目的 | リファクタリング時 | テスト対象 |
|:---|:---|:---|:---|
| **振る舞いテスト** | 仕様通りに動作することを保証 | **変更しない** | ユースケースの入力→出力 |
| **構造テスト** | DDDの設計品質を保証 | DDD実装後に**新規追加** | Value Object, Entity, Domain Rule |

**原則：** 振る舞いテストは「何をするか（What）」を検証し、構造テストは「どう実現するか（How）」を検証する。

### 2.2. テストフレームワーク

- **Vitest** を採用する。ESMネイティブ対応、TypeScriptとの親和性、Next.js環境との互換性による。
- テストファイルの配置: `src/__tests__/` 配下に層別ディレクトリを設ける。

### 2.3. テストファイル配置規約

```
src/
├── __tests__/
│   ├── behavior/                    # 振る舞いテスト
│   │   ├── spot/
│   │   │   ├── createSpot.test.ts
│   │   │   ├── updateSpot.test.ts
│   │   │   └── deleteSpot.test.ts
│   │   └── api/
│   │       ├── getSpotsApi.test.ts
│   │       └── apiKeyManagement.test.ts
│   └── domain/                      # 構造テスト（DDD実装後に追加）
│       ├── models/
│       │   ├── spot/
│       │   │   ├── Rating.test.ts
│       │   │   ├── CarAccessibility.test.ts
│       │   │   ├── AudienceAttributes.test.ts
│       │   │   ├── BestTime.test.ts
│       │   │   ├── Location.test.ts
│       │   │   └── Spot.test.ts
│       │   └── api-key/
│       │       ├── ApiKey.test.ts
│       │       └── RateLimit.test.ts
│       └── rules/
│           └── ElectionLawRules.test.ts
```

### 2.4. ファイル命名規則

- テストファイル: `[テスト対象名].test.ts`
- テストスイート名（`describe`）: テスト対象のクラス名またはユースケース名
- テスト名（`it`）: 仕様ID + 日本語の振る舞い記述（例: `it('UC-CS-01: 正しいパスコードと有効データでSpotが作成される')`）

## 3. テスト層の詳細

### 3.1. 振る舞いテスト（Behavior Tests）

#### 目的
仕様ドキュメント（Use Cases / Business Rules）に定義された振る舞いが正しく実装されていることを保証する。
DDD移行前後で**テストケースもテストコードも変更しない**ことにより、リファクタリングの安全ネットとして機能する。

#### カバレッジ目標

| 対象 | カバレッジ | 備考 |
|:---|:---|:---|
| UseCase 正常系 | **100%** | 全ユースケースの正常系シナリオを網羅 |
| UseCase 異常系 | **100%** | 全ユースケースの異常系シナリオを網羅 |
| Business Rule | **100%** | SpotValidation, Authentication, RateLimit の全ルール |

#### テスト対象ユースケース

| ID | ユースケース | テストファイル |
|:---|:---|:---|
| UC-CS | CreateSpot | `behavior/spot/createSpot.test.ts` |
| UC-US | UpdateSpot | `behavior/spot/updateSpot.test.ts` |
| UC-DS | DeleteSpot | `behavior/spot/deleteSpot.test.ts` |
| UC-GA | GetSpotsApi | `behavior/api/getSpotsApi.test.ts` |
| - | ApiKey Management | `behavior/api/apiKeyManagement.test.ts` |

#### テスト対象外（振る舞いテストのスコープ外）

以下はUI/ブラウザ依存のため、振る舞いテスト（単体テスト）のスコープ外とする。

| ID | ユースケース | 除外理由 |
|:---|:---|:---|
| UC-BM | BrowseMap | Mapbox/Geolocation API等のブラウザAPI依存。E2Eテストで担保。 |
| UC-VD | ViewSpotDetail | UIコンポーネントの表示ロジック。E2Eテストで担保。 |

#### モック戦略

振る舞いテストでは、外部サービスをモックして実行する。

| 外部依存 | モック方法 | 備考 |
|:---|:---|:---|
| Supabase | `vi.mock('@supabase/supabase-js')` | クライアントのメソッドチェーンをモック |
| Cloudflare R2 | `vi.mock('@/lib/r2/client')` | `uploadImage` の戻り値をモック |
| 環境変数 | `vi.stubEnv()` | PASSCODE, ADMIN_PASSWORD 等 |

**DDD移行後の変化：** Repository インターフェースが導入されるため、モックはより自然にインメモリ実装へ置き換え可能になる。ただし、振る舞いテストのテストケース自体は変更しない。

### 3.2. 構造テスト（Domain Tests）

#### 目的
DDDの戦術パターン（Value Object, Entity, Domain Rule）が正しく設計・実装されていることを保証する。
**DDD実装後に新規追加**する。リファクタリング前には存在しない。

#### カバレッジ目標

| 対象 | カバレッジ | 備考 |
|:---|:---|:---|
| Value Object 生成 | **100%** | 正常値・境界値・不正値の全パターン |
| Value Object 振る舞い | **100%** | ソート、等値比較、変換等 |
| Entity 不変条件 | **100%** | 集約ルートの整合性チェック |
| Domain Rule | **100%** | 公職選挙法等のビジネスルール |

#### テスト対象 Value Object

| Value Object | 検証ポイント | 仕様根拠 |
|:---|:---|:---|
| `Rating` | 1-10の範囲制約、ピン色判定 | R-SV-02, UC-BM-03 |
| `CarAccessibility` | 許可値制約（3値） | R-SV-03 |
| `AudienceAttributes` | 許可値制約、定義順ソート | R-SV-06 |
| `BestTime` | 8-19範囲制約、昇順ソート | R-SV-05 |
| `Location` | 緯度(-90~90)、経度(-180~180) | R-SV-04 |

#### テスト対象 Entity

| Entity | 検証ポイント | 仕様根拠 |
|:---|:---|:---|
| `Spot` | 必須プロパティの不変条件、Value Object統合 | Spot Model 定義 |
| `ApiKey` | ハッシュ照合、有効/無効状態管理 | ApiKey Model 定義 |

#### テスト対象 Domain Rule

| Rule | 検証ポイント | 仕様根拠 |
|:---|:---|:---|
| `ElectionLawRules` | 演説可能時間帯（8-19）の制約 | R-SV-05 |
| `RateLimitRule` | 日次10回制限、UTC基準リセット、カウント対象 | R-RL-01, R-RL-02 |

#### テストの特性

構造テストは以下の特性を持つ：

- **外部依存ゼロ：** ドメイン層は純粋なTypeScriptコードであり、モック不要で高速に実行できる。
- **独立実行可能：** 各Value Object / Entity / Rule は他の層に依存せず単独でテスト可能。
- **仕様との直接対応：** テストケースは `02_specifications` 配下のルール定義と1:1で対応する。

## 4. テスト実行

### 4.1. コマンド

```bash
# 全テスト実行
pnpm test

# 振る舞いテストのみ
pnpm test -- --dir src/__tests__/behavior

# 構造テスト（ドメイン）のみ
pnpm test -- --dir src/__tests__/domain

# カバレッジレポート
pnpm test:coverage
```

### 4.2. CI/CD 統合

- プルリクエスト時: 全テスト実行が必須
- マージ条件: 全テストグリーン

## 5. DDD移行フェーズにおけるテスト運用

### Phase 1: 移行前（現在の実装）

1. 振る舞いテストを全て実装する
2. 現在の Server Action / API Route に対してテストを実行し、全てグリーンであることを確認する
3. **制約事項:** 現在の実装はDDD構造を持たないため、振る舞いテストは Server Action を直接呼び出す形式となる。この点は許容する。

### Phase 2: DDD移行

1. ドメイン層（Value Object, Entity, Domain Rule）を実装する
2. アプリケーション層（Use Case）を実装する
3. インフラストラクチャ層（Repository実装）を実装する
4. Server Action をアプリケーション層の薄いアダプターに変更する

### Phase 3: 移行後の検証

1. **振る舞いテストが全てグリーン**であることを確認する（リファクタリング成功の証明）
2. 構造テスト（ドメインテスト）を新規追加し、全てグリーンであることを確認する
3. 手元での動作確認を行う
4. コミットする

## 6. DDD移行後のアプリケーション層テストについて

DDD移行後、必要に応じてアプリケーション層（Use Case）の単体テストを追加することを検討する。
ただし、振る舞いテストがユースケースの入力→出力を既にカバーしているため、**初期段階では振る舞いテスト + 構造テストの2層で十分**とする。

アプリケーション層テストが必要になるケース：
- Use Case 内に複雑なオーケストレーションロジックが追加された場合
- 複数の集約をまたぐトランザクション管理が必要になった場合
- ドメインイベント発行のハンドリングが追加された場合

## 7. 関連ドキュメント

- [UseCase 定義](../02_specifications/02_use_cases/)
- [ドメインモデル定義](../02_specifications/01_ubiquitous_language/01_models/)
- [ビジネスルール定義](../02_specifications/01_ubiquitous_language/02_rules/)
- [TechStack](./TechStack.md)
