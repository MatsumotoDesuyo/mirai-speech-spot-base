# 開発環境セットアップガイド (Setup)

本プロジェクトは Next.js, Supabase, Mapbox, Cloudflare R2 を使用しています。このドキュメントでは、エンジニア向けのローカル開発環境構築手順（QuickStart）を説明します。

## Step 1: リポジトリのクローンと依存関係のインストール
```bash
git clone https://github.com/MatsumotoDesuyo/mirai-speech-spot-base.git
cd mirai-speech-spot-base/10_speech_spot_app/02_value_creation/src
npm install
```
*(※リポジトリの直下ではなく、アプリの実装ディレクトリである `10_speech_spot_app/02_value_creation/src` に移動して実行してください)*

## Step 2: 外部サービスのAPIキー取得（BYOK: Bring Your Own Key）
ローカル開発用に、以下の無料アカウントを各自で作成し、キーを取得してください。
* **Mapbox**: [Mapbox Access Token](https://www.mapbox.com/)
* **Cloudflare R2**: [Cloudflare Dashboard](https://dash.cloudflare.com/)

## Step 3: 環境変数の設定
`10_speech_spot_app/02_value_creation/src/` ディレクトリに `.env.local` を作成します。（`.env.local.example` があればそれをコピーしてください）
先ほど取得したAPIキーなどの必要な環境変数を設定してください。

## Step 4: Supabaseのローカル起動とスキーマ適用
Dockerが起動していることを確認し、以下のコマンドを実行します。

```bash
cd 10_speech_spot_app/02_value_creation/src
npx supabase start
```
起動時、`supabase/migrations/` ディレクトリ内のSQLファイルが読み込まれ、自動的にデータベーススキーマが適用されます。

## Step 5: 開発サーバーの起動

```bash
cd 10_speech_spot_app/02_value_creation/src
npm run dev
```
`http://localhost:3000` にアクセスしてマップが表示されれば成功です！
