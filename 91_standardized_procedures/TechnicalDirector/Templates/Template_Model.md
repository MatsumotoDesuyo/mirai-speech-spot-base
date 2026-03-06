# Model: [モデル名] (例: Unit, Combat)
## 1. 定義 (Definition)
この世界における [モデル名] とは、...

## 2. 状態・プロパティ (State & Properties)
* **[プロパティ名]**: [型/説明] (例: CurrentHP。変動する値。)
* **[プロパティ名]**: [型/説明] (例: ID。一意の識別子。)

## 3. 不変条件 (Invariants)
* ルール: [例: HPは決してMaxHPを超えない]
* ルール: [例: Combat終了時は必ず参加者のResultStateを確定させる]

## 4. 振る舞い (Methods)
* **[メソッド名]**: [何をするか] (例: TakeDamage - HPを減らし、0ならDeadにする)