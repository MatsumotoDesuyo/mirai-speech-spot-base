# Development Work Queue

> **To GitHub Copilot:**
> This file defines the priority of tasks.
> 1. Focus **ONLY** on the task listed in the "Current Task" section.
> 2. Do not implement tasks in the "Backlog" section until they are moved to "Current Task".
> 3. Read the linked `requirements` files carefully before writing any code.

---

## 🚀 Current Task (進行中のタスク)
- [ ] **Feature: [機能名] の実装**
    - **目的**: [何を実現するかを一言で]
    - **参照ドキュメント (Source of Truth)**:
        - UseCase: `02_requirements/UseCases/[TargetFile].md`
        - Models: `02_requirements/UbiquitousLanguage/Models/[TargetModel].md`
    - **実装ステップ**:
        1. [ ] ドメインモデル (`Models/Rules`) の実装と単体テスト作成
        2. [ ] ユースケース (`UseCases`) の実装と単体テスト作成
        3. [ ] 全テストがGreenになることを確認
    - **特記事項**:
        - [AIへの具体的な注意点があればここに書く]

---

## 📋 Backlog (未着手タスク)
- [ ] Feature: [次の機能名]
    - 参照: `02_requirements/UseCases/...`
- [ ] Refactor: [リファクタリング対象]
    - 理由: ...

---

## ✅ Completed (完了済み)
- [x] Feature: [完了した機能名] (YYYY/MM/DD)
    - 実装ファイル: `src/Domain/...`