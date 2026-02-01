# Changelog

## [1.0.0] - 2025-09-18

### Added
- 初期リリース：sync-knowledgeツールの実装
- 統合コンテクストファイルのGoogle Drive同期機能
- 設定ファイルベースの柔軟な設定管理
- 包括的なエラーハンドリングとバリデーション
- default_tool_architectureに準拠したモジュラー設計

### Features
- `tools/tool-config.json`から自動的にコピー元パスを取得
- `config.json`でコピー先ディレクトリを設定可能
- ファイルとディレクトリの存在確認
- 詳細な成功・失敗メッセージ
- TypeScriptによる型安全な実装

### Technical Details
- Node.js標準ライブラリを使用したファイル操作
- 単一責任の原則に基づくクラス設計
- エラーメッセージと成功メッセージの一元管理
- npm workspacesによるモノレポ対応