# Deployment

## Vercel
- **Root Directory:** `src`
- 環境変数: `.env.local` と同等の値を設定

## Supabase
- **ローカル開発:** `npx supabase start`
- **本番:** Supabase Cloudでプロジェクト作成、`schema.sql`を実行

## Mapbox
- 本番ドメインをトークンの許可URLに追加

## Cloudflare R2
- Public Development URL使用（カスタムドメイン不要）
- 将来的にはCloudflare Workers経由またはカスタムドメインで対応可能

## 環境変数一覧

| 変数名 | スコープ | 説明 |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase接続URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase匿名キー |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Public | Mapboxアクセストークン |
| `NEXT_PUBLIC_DEFAULT_CENTER_LNG` | Public | デフォルト中心経度 |
| `NEXT_PUBLIC_DEFAULT_CENTER_LAT` | Public | デフォルト中心緯度 |
| `NEXT_PUBLIC_DEFAULT_ZOOM` | Public | デフォルトズームレベル |
| `R2_ACCOUNT_ID` | Server | Cloudflare R2アカウントID |
| `R2_ACCESS_KEY_ID` | Server | R2アクセスキーID |
| `R2_SECRET_ACCESS_KEY` | Server | R2シークレットアクセスキー |
| `R2_BUCKET_NAME` | Server | R2バケット名 |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public | R2公開URL |
| `PASSCODE` | Server | 投稿用共有パスコード |
| `ADMIN_PASSWORD` | Server | 管理者パスワード |
| `API_ADMIN_PASSCODE` | Server | API管理ページ用パスコード（32文字以上） |
