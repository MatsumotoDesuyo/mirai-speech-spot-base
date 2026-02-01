# Naming Conventions Standard

## 1. 目的 (Purpose)

プロジェクト内の全てのファイルとディレクトリの命名規則を標準化し、予測可能性と一貫性を担保する。これにより、人間とAIの双方が、必要な情報へ迅速にアクセスできる状態を維持する。

## 2. 基本原則 (Basic Principles)

-   **英語を基本とする**: 全ての名前は、半角英数字、ハイフン (`-`)、アンダースコア (`_`) を用いて英語で記述する。
-   **意味のある単語を選ぶ**: `temp` や `misc` のような曖昧な名前を避け、内容を正確に表す単語を選ぶ。

## 3. ディレクトリの命名規則

ディレクトリ名は、**`snake_case`（スネークケース）**で統一する。全て小文字とし、単語間をアンダースコア (`_`) で接続する。

-   **目的**:
    -   OSによる大文字・小文字の扱いの差異を吸収できる。
    -   単語の区切りが明確で、可読性が高い。

-   **良い例**:
    -   `/roles`
    -   `/standardized_procedures`
    -   `/meeting_notes`

-   **悪い例**:
    -   `/Roles` (大文字)
    -   `/standardized-procedures` (ハイフン)
    -   `/meeting notes` (スペース)

## 4. ファイルの命名規則

ファイル名は、原則として**`PascalCase`（パスカルケース）**で統一する。各単語の先頭を大文字とし、単語間を接続する。

-   **目的**:
    -   ディレクトリ名とファイル名を視覚的に区別しやすくする。
    -   ドキュメントの正式名称とファイル名を一致させやすい。

### 4.1. 一般的なドキュメント

ドキュメントのタイトルをそのままファイル名にする。

-   **例**:
    -   `TheC2VEngine.md`
    -   `DirectoryStructureStandard.md`
    -   `MarketResearchReport.md`

### 4.2. 標準化されたドキュメント

特定のカテゴリに属する標準化されたドキュメントは、**`PascalCase` + `_Suffix.md`** の形式とする。

-   **ロール定義書**: `_Role.md`
    -   **例**:
        -   `MissionOwner_Role.md`
        -   `MarketInsightAnalyst_Role.md`

-   **手順書**: `_Procedure.md`
    -   **例**:
        -   `IgnitionSequence_Procedure.md`
        -   `DefineRole_Procedure.md`

-   **命名規約**:
    -   このサフィックス（接尾辞）により、ファイル名を見るだけでそのファイルがどのような種類のドキュメントであるかを即座に判断できる。