# sync-knowledge

統合コンテクストファイルを、ユーザー設定のGoogle Drive同期ディレクトリにコピーするコマンドラインツールです。

## 目的

Gemの知識ベース更新プロセスを自動化するために開発されました。`build-context`ツールで生成されたコンテクストファイルを、クラウドストレージと同期させる役割を担います。

## セットアップ

1. **config.jsonの設定**
   
   初回使用前に、`tools/sync-knowledge/config.json`ファイルの`destinationPath`を、お使いのGoogle Drive同期ディレクトリに更新してください。

   ```json
   {
     "destinationPath": "C:\\Users\\[YourUsername]\\Google Drive\\知識ベース"
   }
   ```

   > **注意**: パスは実際のGoogle Drive同期フォルダの絶対パスに置き換えてください。

## 使用方法

プロジェクトルートディレクトリから以下のコマンドを実行します：

```bash
npm run sync:knowledge
```

## 機能

- **設定読み込み**: `tools/tool-config.json`から`artifacts.gemContextPath`を読み取り、コピー元ファイルを特定
- **バリデーション**: 設定ファイルやファイルパスの存在確認
- **ファイルコピー**: 統合コンテクストファイルを指定されたGoogle Drive同期ディレクトリに上書きコピー
- **フィードバック**: 成功・失敗時の詳細なメッセージ表示

## エラーハンドリング

以下の場合にエラーが発生し、処理が中断されます：

- 設定ファイル（`tool-config.json`または`config.json`）が存在しない
- 必要な設定キーが見つからない
- コピー元ファイルが存在しない、またはファイルではない
- コピー先ディレクトリが存在しない、またはディレクトリではない
- ファイルコピー処理中にエラーが発生

## 技術仕様

- **実行環境**: Node.js (LTS版)
- **開発言語**: TypeScript
- **アーキテクチャ**: `default_tool_architecture.md`に準拠

## ディレクトリ構成

```
tools/sync-knowledge/
├── src/
│   ├── main.ts          # メインロジック
│   └── utils.ts         # ユーティリティ関数
├── config.json          # ツール設定（要手動設定）
├── package.json         # npm設定
├── README.md            # このファイル
└── CHANGELOG.md         # 変更履歴
```

## 関連ツール

- **build-context**: 統合コンテクストファイルを生成
- **tool-config.json**: ツール間での情報共有