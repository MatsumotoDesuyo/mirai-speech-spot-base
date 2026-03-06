# 仕様書：`deliver-context`コマンド

## 1. 機能概要 (Overview)
---
### 1.1. 解決する課題
コンテキストファイルの生成（`build:context`）と、Google Driveへの同期（`sync-knowledge`）が別々のコマンドとして存在しており、ユーザーは2つのコマンドを順に実行する必要がある。

### 1.2. 提供する価値
- **ワンコマンド実行:** `build:context`と`sync-knowledge`の連続実行を、`deliver-context`という単一のコマンドで実現する。

## 2. 要求仕様 (Requirements)
---
### 2.1. 実装方法
- 本機能は、新しいスクリプトファイルを実装するのではなく、ルートディレクトリの`package.json`の`scripts`セクションを編集することによって実現する。

### 2.2. スクリプトの定義
- `package.json`の`scripts`に、`deliver-context`という新しいスクリプトを定義する。
- このスクリプトは、内部で`npm run build:context`と`npm run sync-knowledge`を順次実行する。
- `build:context`が成功した場合にのみ`sync-knowledge`が実行されるようにすること。

### 2.3. コマンド実行例
- ユーザーがターミナルで `npm run deliver:context` を実行すると、`build:context`が実行され、続いて`sync-knowledge`が実行される。

## 3. 成果物 (Deliverables)
---
- `scripts`セクションに`deliver-context`が追加された、更新後の`package.json`。

## 4. 設定ファイル
---
- 本コマンドは、既存の`build:context`および`sync-knowledge`のそれぞれの設定ファイルに依存し、独自の設定ファイルは持たない。
