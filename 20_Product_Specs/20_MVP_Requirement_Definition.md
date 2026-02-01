# 20_MVP_Requirement_Definition.md

## 1. Introduction
* **Project:** みらい街頭演説Base
* **Version:** 1.2 (Updated for MVP Release)
* **Goal:** 48時間以内に、政党サポーターが「効果的な演説場所」を共有・検索できるマップアプリをリリースする。
* **Core Value:** 街頭演説における「場所の質（Speech Score）」を可視化し、陣営全体の活動効率を最大化する。

## 2. User Roles
* **Campaign Staff (Supporter):**
    * 良い演説場所を見つけ、写真と評価を投稿する。
    * 地図を見て、次に活動すべき場所を探す。
    * 既存のスポット情報を編集・更新できる。
    * **Auth:** なし（共有パスコードによる書き込み制限のみ）。
* **Admin (Mission Owner/Dev):**
    * 不適切な投稿を削除する。
    * **Auth:** ハードコードされたパスワードによる簡易認証。

## 3. Key Features & UI/UX

### 3.1. Map View (Main Screen)
* **Engine:** Mapbox (via `react-map-gl/mapbox` - v8対応)。
* **Default View:** 重点活動エリア（環境変数 `NEXT_PUBLIC_DEFAULT_CENTER_LNG/LAT` で設定）。
* **Pins:**
    * 登録されたスポットにピンを表示。
    * ピンの色で「推奨Lv」を直感的に表現（Lv8以上は赤、Lv5-7は青、Lv1-4はグレー）。
* **Interaction:**
    * ピンタップでスポット詳細をBottomSheet表示（画像カルーセル、推奨Lv、選挙カー可否、聴衆属性、おすすめ時間帯、コメント）。
    * 詳細画面から「編集する」ボタンで編集モードへ遷移可能。
    * 地図上の長押し（モバイル）または右クリック（デスクトップ）で新規スポット登録フォームを開く。
* **Location Logic**
    * **Default:** マップの初期表示位置は国会議事堂周辺（環境変数で設定可能）。
    * **User Location:** 右下の現在地ボタン（Locateアイコン）をタップすると、Geolocation APIで現在地を取得しズームレベル16で移動。
* **Localization:**
    * マップの地名・道路名ラベルは日本語（`name_ja`）優先で表示。
* **Mobile Optimization:**
    * iOS/Androidのブラウザナビゲーションバーを考慮し、UIは`safe-area-inset-bottom`でオフセット。
    * タッチ長押し（500ms）でスポット登録、10px以上の移動でキャンセル、バイブレーションフィードバック対応。

### 3.2. Post Spot (投稿機能)
* **Trigger:** 地図上で長押し（モバイル）または右クリック（デスクトップ）。
* **Input Fields:**
    1.  **Title (必須):** 場所の名前（例：〇〇スーパー前）。
    2.  **Photo (必須):** 現場の状況がわかる写真（Cloudflare R2へアップロード）。
        * 撮影ガイダンス表示あり（引きで撮影、演説者・選挙カー・背後の建物が入るように等）。
    3.  **Speech Score (推奨Lv) (必須):** 1〜10のスライダー。
        * *Default:* **Lv 7**
        * **Lv 10:** 【S級】広場・ランドマーク（確実な聴衆）
        * **Lv 8-9:** 【A級】主要駅・スーパー（主力）
        * **Lv 6-7:** 【B級】商店街・公園（堅実な対話）
        * **Lv 5:** 【C級】穴場（特定層向け）
        * **Lv 1-4:** (UI上は選択可だが、推奨度低として扱う)
    4. **Audience Attributes:** マルチセレクトタグ（主婦、学生、社会人、高齢者、ファミリー）。
        * 保存時に定義順でソートされる。
    5. **Car Accessibility (必須):** 選挙カー利用可否。バッジ形式で選択。
        * `allowed`: 使用可
        * `brief_stop`: 一瞬の乗降のみ可
        * `not_allowed`: 不可
    6.  **Best Time:** 
        * 1時間単位のマルチセレクト (08:00 ~ 22:00)。
        * 保存時に時刻順でソートされる。
        * **Default:** 未選択（空配列）。
    7.  **Description:** 補足情報。
    8.  **Passcode (必須):** 共有パスコード（チーム内で共有）。

### 3.3. Edit Spot (編集機能)
* **Trigger:** スポット詳細画面の「編集する」ボタン。
* **UI:** 新規投稿と同じフォームを流用。既存データがプリセットされた状態で表示。
* **Image Handling:**
    * 既存画像は「[保存済]」ラベル付きで表示。
    * 既存画像の削除、新規画像の追加、並び替えが可能。
* **Position:** 編集時は位置（緯度・経度）の変更は不可。
* **Auth:** 投稿時と同じ共有パスコードで認証。

### 3.4. Image Management (Multi-upload & Reorder)
* **Camera Capture:** 「カメラで撮影」ボタンでスマートフォンのカメラを直接起動し、その場で撮影した写真をアップロード可能。
* **File Upload:** react-dropzoneによるドラッグ&ドロップ、またはファイル選択。
* **Size Limit:** 1ファイル10MBまで、Server Actions全体で10MBまで。
* **Preview:** アップロード直後にプレビューが表示される。
* **Reorder:** 「上へ/下へ」ボタンにより、画像の表示順序を変更できる。
* **Delete:** 個別の画像を削除可能。

### 3.5. Spot Detail View (詳細表示)
* **UI:** BottomSheet形式で70%の高さで表示。
* **Content (上から順に):**
    1. タイトル + 推奨Lvバッジ
    2. 選挙カー利用可否（Carアイコン付き）
    3. 聴衆属性（タグバッジ）
    4. おすすめ時間帯（タグバッジ）
    5. 説明文
    6. 画像カルーセル（複数枚対応、ナビゲーション付き）
    7. メタ情報（ID、登録日、座標）
    8. 編集ボタン
* **ID表示:** 管理者が削除時に参照できるよう、IDを`select-all`クラスでコピーしやすく表示。

### 3.6. History & Rollback (Audit Log) - 未実装
* **Status:** DBトリガーでの履歴記録は実装済み。UI未実装。
* **Auto Save:** スポット情報の作成・編集・削除時、システムは自動的に変更前のスナップショットを保存する。
* **Future:** 詳細画面から「変更履歴」タブにアクセス、過去バージョンへの復元機能。

### 3.7. Admin Deletion (管理機能)
* **URL:** `/admin` (隠しページではないが、リンクは置かない)。
* **UI:** 削除したい `Spot ID` と `Admin Password` の入力フォームのみ。
* **Logic:** パスワードが一致すれば、指定IDのレコードを物理削除する。

## 4. Non-Functional Requirements
* **Speed:** 画像はR2に保存、Mapbox/Supabaseは各CDN経由で配信。
* **Security:**
    * ユーザー認証機能は実装しない。
    * 書き込みはServer Actions経由でのみ許可し、パスコード検証を必須とする。
    * R2/Supabaseの秘密鍵はサーバーサイドでのみ使用。
* **Device:** モバイルファースト（スマホでの操作性を最優先）。

## 5. Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# Map Defaults
NEXT_PUBLIC_DEFAULT_CENTER_LNG=139.7447
NEXT_PUBLIC_DEFAULT_CENTER_LAT=35.6762
NEXT_PUBLIC_DEFAULT_ZOOM=14

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
NEXT_PUBLIC_R2_PUBLIC_URL=

# Security
PASSCODE=
ADMIN_PASSWORD=
```