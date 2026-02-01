# build-context

AIODフレームワーク用「コンテキスト統合ツール」

## 概要
`build-context`は、AIオーケストレーション開発（AIOD）の上流工程で作成・更新される複数のドキュメントファイルを、AIエージェントに与えるための「統合コンテキストファイル」に自動変換するコマンドラインツールです。複数のターゲット（tool、upstream、product）に対応し、それぞれ異なるコンテキストファイルを生成できます。

## 主な機能
- ターゲット別のコンテキスト生成（tool、upstream、product）
- `tools/build-context/config.json`で指定したファイル・ディレクトリを、指定順に統合
- ディレクトリは拡張子フィルタ＆名前順で全ファイルを再帰的に統合
- 各ファイルの内容は「--- Start of [パス] ---」ヘッダー付きで結合
- 統合結果を`tools/tool-config.json`で指定した出力先に保存
- 存在しないパスは警告を出してスキップ
- コマンドライン引数による特定ターゲットの指定

## 使い方

### 基本的な使用方法

```bash
# すべてのターゲットに対してコンテキストファイルを生成
npm run build:context

# 特定のターゲットのみ生成
npm run build:context -- --type tool
npm run build:context -- --type upstream
npm run build:context -- --type product
```

### 出力ファイル

設定に基づき、以下のファイルが生成されます：

- `./dist/context.tool.md` - ツール開発用コンテキスト
- `./dist/context.upstream.md` - 上流工程用コンテキスト
- `./dist/context.product.md` - プロダクト開発用コンテキスト

## 設定ファイル

### tools/build-context/config.json

ビルド対象とするソースパスを定義します：

```json
{
  "targets": {
    "upstream": { 
      "sources": [ 
        "system_prompt.md", 
        "knowledge/", 
        "playbooks/", 
        ".docs/" 
      ] 
    },
    "tool": { 
      "sources": [ 
        "system_prompt.md", 
        "knowledge/", 
        ".docs/" 
      ] 
    },
    "product": { 
      "sources": [] 
    }
  },
  "extensionsToProcess": [
    ".md"
  ]
}
```

### tools/tool-config.json

出力先パスを定義します：

```json
{
  "output": {
    "context": {
      "upstream": "./dist/context.upstream.md",
      "tool": "./dist/context.tool.md", 
      "product": "./dist/context.product.md"
    }
  }
}
```

## エラーハンドリング

- **存在しないソースパス**: 警告メッセージを表示し、処理を継続
- **設定ファイルエラー**: 致命的エラーとして異常終了
- **ファイル読み込み権限エラー**: 致命的エラーとして異常終了

## 技術スタック
- Node.js (LTS)
- TypeScript
- npm workspaces

## ライセンス
本ツールはAIODプロジェクト内部利用を前提としています。
