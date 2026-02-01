# 20_MVP_Requirement_Definition.md

## 1. Introduction
* **Project:** みらい街頭演説Base
* **Version:** 1.1 (Final for MVP)
* **Goal:** 48時間以内に、政党サポーターが「効果的な演説場所」を共有・検索できるマップアプリをリリースする。
* **Core Value:** 街頭演説における「場所の質（Speech Score）」を可視化し、陣営全体の活動効率を最大化する。

## 2. User Roles
* **Campaign Staff (Supporter):**
    * 良い演説場所を見つけ、写真と評価を投稿する。
    * 地図を見て、次に活動すべき場所を探す。
    * **Auth:** なし（共有パスコードによる書き込み制限のみ）。
* **Admin (Mission Owner/Dev):**
    * 不適切な投稿を削除する。
    * **Auth:** ハードコードされたパスワードによる簡易認証。

## 3. Key Features & UI/UX

### 3.1. Map View (Main Screen)
* **Engine:** Mapbox (via `react-map-gl`).
* **Default View:** 重点活動エリア（環境変数 `NEXT_PUBLIC_DEFAULT_CENTER` で設定）。
* **Pins:**
    * 登録されたスポットにピンを表示。
    * ピンの色やアイコンで「推奨Lv」を直感的に表現（例: Lv8以上は赤、Lv5-7は青）。
* **Interaction:**
    * ピンタップでスポット詳細をカード表示（画像、推奨Lv、コメント）。
* **Location Logic**
    * **Default:** マップの初期表示位置は国会議事堂周辺とする。
    * **User Location:** ブラウザのGeolocation APIを使用し、ユーザーが位置情報の利用を許可した場合は、自動的に現在地へマップを移動（FlyTo）させる。
    * **Mobile UX:** モバイル端末では、現在地追従ボタンを押しやすい位置に配置する。

### 3.2. Post Spot (投稿機能)
* **Trigger:** マップ上の「＋」ボタン、または地点長押し。
* **Input Fields:**
    1.  **Title (必須):** 場所の名前（例：〇〇スーパー前）。
    2.  **Photo (必須):** 現場の状況がわかる写真（Cloudflare R2へアップロード）。
    3.  **Speech Score (推奨Lv) (必須):** 1〜10のスライダー。
        * *Default:* **Lv 7**
        * **Lv 10:** 【S級】広場・ランドマーク（確実な聴衆）
        * **Lv 8-9:** 【A級】主要駅・スーパー（主力）
        * **Lv 6-7:** 【B級】商店街・公園（堅実な対話）
        * **Lv 5:** 【C級】穴場（特定層向け）
        * **Lv 1-4:** (UI上は選択可だが、推奨度低として扱う)
    4. **Audience Attributes:** マルチセレクトタグ（主婦、学生、社会人、高齢者、ファミリー）。
    5.  **Best Time:** 
        * 1時間単位のマルチセレクト (08:00 ~ 22:00)。
        * **Default:** 15:00 が選択された状態。
    6.  **Description:** 補足情報。

### 3.3. Image Management (Multi-upload & Reorder)
* **Upload:** ユーザーはSpotに対し、一度に複数の写真を選択・アップロードできる。写真はその場で撮影したものをアップロードすることもできるし、ローカル上の画像ファイルをアップロードすることもできる。
* **Preview:** アップロード直後にプレビューが表示される。
* **Reorder:** ドラッグアンドドロップ、または「上へ/下へ」ボタンにより、画像の表示順序を変更できる。
* **Delete:** 投稿済みの特定の画像のみを削除できる。

### 3.4. History & Rollback (Audit Log)
* **Auto Save:** スポット情報の作成・編集・削除時、システムは自動的に変更前のスナップショットを保存する。
* **History View:** 詳細画面（または編集画面）から「変更履歴」タブにアクセスできる。
* **Restore:** 過去の任意のバージョンを選択し、「このバージョンに復元」することができる（新規更新として扱われ、その復元操作自体も履歴に残る）。

### 3.3. Admin Deletion (管理機能)
* **URL:** `/admin` (隠しページではないが、リンクは置かない)。
* **UI:** 削除したい `Spot ID` と `Admin Password` の入力フォームのみ。
* **Logic:** パスワードが一致すれば、指定IDのレコードを物理削除する。

## 4. Non-Functional Requirements
* **Speed:** 画像はWebP等で軽量化し、モバイル回線でも高速に表示すること。
* **Security:**
    * ユーザー認証機能は実装しない。
    * 書き込みはServer Actions経由でのみ許可し、パスコード検証を必須とする。
* **Device:** モバイルファースト（スマホでの操作性を最優先）。