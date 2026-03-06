# UseCase: [ユースケース名] (例: AttackCommand)
## 1. 目的 (Goal)
ユーザーは [何] をするために、この機能を利用する。

## 2. フロー (Process Flow)
1. [Trigger] ユーザーが攻撃ボタンを押す。
2. [Process] `Combat` モデルから現在の行動順を取得。
3. [Process] `CombatLogic` ルールを用いてダメージ計算。
4. [Process] `Unit` モデルにダメージ適用。
5. [Result] UIにダメージを表示し、ターンを経過させる。

## 3. UI/UX要求 (UI/UX Requirements)  <-- 追加！
* **必要な表示情報**:
    * 現在のHP / MaxHP
    * 敵の名称
    * ダメージ演出（数値がポップアップする）
* **ユーザー操作**:
    * 「攻撃ボタン」を押下可能
    * 敵をタップしてターゲット選択可能

## 4. テストシナリオ (Scenarios & Acceptance Criteria)
### Scenario: [シナリオ名]
* **Given**: ...
* **When**: ...
* **Then**: ...