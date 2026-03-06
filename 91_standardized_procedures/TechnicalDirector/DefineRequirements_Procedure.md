# C2V Engine Requirements Definition Procedure

- **Procedure ID**: P003
- **Version**: 1.0
- **Last Updated**: 2026-02-14

---

この手順は、プロジェクトのミッションやアイデア（抽象）を、実装可能な要件（具象）へと変換するための標準プロセスである。
C2Vにおいて、GEXO(人間)は「コード」を書くのではなく、この「要件定義（Requirements）」を書くことに全力を注ぐ。これが作業者（AI）にとっての絶対的な「正解（Source of Truth）」となる。

---

## 目的 (Purpose)
1.  **曖昧さの排除**: 「何を作るか」を明確にし、AIによる実装の手戻りを防ぐ。
2.  **品質の定義**: 「どう動けば正解か」をテスト可能なレベルで定義する。
3.  **関心の分離**: 「ビジネスルール（Domain）」と「ユーザー体験（UseCase）」を分けて管理する。

---

## トリガー (Trigger)

以下のいずれかの状況が発生したときに、この手順を開始する。

* 新しい機能の実装が決定し、AIコーダーに作業を渡す必要があるとき。
* 既存機能の仕様変更が発生し、要件ドキュメントの更新が必要なとき。
* ゲームデザイン上の新しいルールや概念が定義され、ドメイン知識として文書化する必要があるとき。

---

## 事前準備 (Prerequisites)
* 実装したい機能やアイデアが、プロジェクトのミッション（北極星）に寄与することが確認されていること。
* `02_value_creation/01_game_development/05_engineering/02_requirements` ディレクトリへのアクセス権があること。
* テンプレートの所在: `91_standardized_procedures/engineer/Templates/` 配下の各テンプレートファイル。

---

## ステップ1: ユビキタス言語の定義 (Define Ubiquitous Language)

まず、その機能を実現するために必要な「名詞（モノ）」と「ルール（知識）」を定義する。これらは `02_value_creation/01_game_development/05_engineering/02_requirements/UbiquitousLanguage` 配下に格納する。

### 1.1. モデルの定義 (Models)
「状態（State）」や「ライフサイクル」を持つ概念があるか？
（例：HPを持つ `Unit`、ターン数を持つ `Combat`、ゲーム世界の構造を定義する `GameWorldStructure`）

1.  `02_value_creation/01_game_development/05_engineering/02_requirements/UbiquitousLanguage/Models` を確認し、既存のモデルがあればそれを利用する。
2.  なければ、`91_standardized_procedures/engineer/Templates/Template_Model.md` をコピーして新規作成する。
3.  **記述のポイント**:
    * プロパティ（データ）だけでなく、**不変条件（絶対に守るべき制約）**を必ず書く。
    * メソッドは「何ができるか」だけ書き、中身の複雑な計算ロジックは書かない。
    * 実行時に変化する**エンティティ**（例: `GameState`）と、変化しない**データ定義**（例: `GameWorldStructure`）の両方をモデルとして定義できる。

### 1.2. ルールの定義 (Rules)
「状態」を持たない「計算式」や「静的な知識」があるか？
（例：ダメージ計算式、経験値テーブル、ドロップ率）

1.  `02_value_creation/01_game_development/05_engineering/02_requirements/UbiquitousLanguage/Rules` を確認する。
2.  なければ、`91_standardized_procedures/engineer/Templates/Template_Rule.md` をコピーして新規作成する。
3.  **記述のポイント**:
    * **入力と出力**を明確にする（関数的な定義）。
    * 特定のモデルに依存しすぎないよう、純粋な計算ロジックとして記述する。

---

## ステップ2: ユースケースの定義 (Define Use Cases)

次に、定義したユビキタス言語を使って、ユーザーがどのような体験をするか（文脈）を定義する。

### 2.1. ユースケースの作成
1.  `02_value_creation/01_game_development/05_engineering/02_requirements/UseCases` に、`91_standardized_procedures/engineer/Templates/Template_UseCase.md` をコピーして新規作成する。
    * ファイル名例: `PlayerAttack.md`, `ShopPurchase.md`
2.  **フローの記述**:
    * ユーザーのアクションから始まり、システムがどう応答するかを時系列で書く。
    * 「`Combat` モデルのデータを参照し、`CombatLogic` で計算し、結果を表示する」といった具合に、ステップ1で定義した言葉を使う。

### 2.2. UI/UX要求の記述
* 具体的な画面デザイン（HTML/CSS等）は書かない。
* **「何を表示すべきか（情報）」**と**「何が操作できるか（インタラクション）」**を定義する。

### 2.3. テストシナリオの記述 (重要)
AIが実装完了を判断するための基準（Acceptance Criteria）を書く。

* **Gherkin記法 (Given / When / Then)** を推奨。
* 正常系（ハッピーパス）だけでなく、異常系（エラー、境界値）も最低1つは書く。
* ここでの記述が、そのまま自動テストコードの仕様となる。

---

## ステップ3: インフラ/技術詳細の除外 (Exclude Infrastructure)

以下の内容は `02_requirements` に**書いてはならない**。これらはアーキテクチャルール（`01_architecture/`）とAIの自律判断に委ねる。

* × データベースのテーブル定義（SQLなど）
* × 具体的な通信ライブラリの選定
* × クラスの継承関係や詳細なコード設計図
* × Unity固有の実装詳細（MonoBehaviour, ScriptableObject, SerializeField等）
* × UIフレームワーク固有の実装方法（uGUI, UI Toolkit等）

---

## ステップ4: レビューと登録 (Review & Register)

### 4.1. 自己レビュー
* **網羅性**: そのドキュメントだけで、新入社員（またはAI）が迷わず実装できるか？
* **整合性**: 既存の `UbiquitousLanguage` と矛盾していないか？

### 4.2. タスク登録
ドキュメントができたら、実装作業を開始するために `WORK_QUEUE.md` を更新する。

1.  `02_value_creation/01_game_development/05_engineering/09_tasks/WORK_QUEUE.md` の「Current Task」または「Backlog」にタスクを追加する。
2.  作成したmdファイルへのパスを明記する。

---

## 成果物 (Artifacts)

この手順を完了した際に、作成または更新されるべき最終的な成果物は以下の通りである。

| 成果物 | 格納先 |
|---|---|
| モデル定義書 | `02_value_creation/01_game_development/05_engineering/02_requirements/UbiquitousLanguage/Models/[ModelName].md` |
| ルール定義書 | `02_value_creation/01_game_development/05_engineering/02_requirements/UbiquitousLanguage/Rules/[RuleName].md` |
| ユースケース定義書 | `02_value_creation/01_game_development/05_engineering/02_requirements/UseCases/[UseCaseName].md` |
| 更新されたタスクキュー | `02_value_creation/01_game_development/05_engineering/09_tasks/WORK_QUEUE.md` |