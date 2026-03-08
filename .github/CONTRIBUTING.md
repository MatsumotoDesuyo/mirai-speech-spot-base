# みらい街頭演説Base への貢献について (Contributing)

本プロジェクトにご関心をお寄せいただき、誠にありがとうございます！
私たちは、「日本の政治参入における『知的資産による障壁』を限りなくゼロに近づける」というミッションを掲げています。このOSSは、その第一歩となるプラットフォームです。

## 1. プロジェクトのビジョンと制約事項
開発に参加する前に、以下のドキュメントをご一読ください。すべての提案や実装は、これらに合致するかどうかで判断されます。

* **[10_Mission.md](./01_value_strategy/10_Mission.md)**: なぜ私たちがこのプロジェクトをやっているのか
* **[11_NorthStar.md](./01_value_strategy/11_NorthStar.md)**: 私たちが目指す究極のユーザー体験
* **[12_Values_and_Constraints.md](./01_value_strategy/12_Values_and_Constraints.md)**: 遵守すべき法令や行動規範（他陣営の妨害機能は作らない等）

## 2. コミュニケーションチャネル
* **GitHub Issues / Discussions**: 機能提案、バグ報告、技術的な議論は基本的にここで行います。なるべくGitHub上でコミュニケーションを完結させることを推奨します。
* **Slack**: 非エンジニアのメンバー（要件定義参加者）やドメインエキスパートとのやり取りなど、GitHubに不慣れなメンバーとの窓口として使用します。（※参加リンクは[こちら](https://team-mirai-volunteer.slack.com/archives/C0ACBTPPWG5)）

## 3. 貢献のワークフロー

1. **Issueを作成する**: 新しい機能やバグ修正に取り組む前に、必ずIssueを立てて目的を共有してください。
2. **ミッションオーナーのレビュー**: 提案内容がプロジェクトのミッションや北極星に合致するか、ミッションオーナーがGo/No-Goの審査を行います。ミッションから逸脱する機能（Feature Creep）については却下されることがありますが、これはプロダクトの健全性を保ち、誰もが迷いなく価値創造に集中するためのプロセスです。また、ミッションオーナーが不当な判断を行ったと認められた場合、コミュニティはミッションオーナーの責務と権限を適切な人物に再配置させるよう努めます。
3. **実装とPR**: （※ブランチ戦略・PRのルールは現在未策定です！ 最適な運用方法について提案してくれるアーキテクト・エンジニアを大募集しています。現時点では `main` ブランチ以外からPRを作成してください。）

## 4. ローカル環境の構築

本プロジェクトは Next.js, Supabase, Mapbox, Cloudflare R2 を使用しています。

### Step 1: リポジトリのクローンと依存関係のインストール
```bash
git clone [https://github.com/MatsumotoDesuyo/mirai-speech-spot-base.git](https://github.com/MatsumotoDesuyo/mirai-speech-spot-base.git)
cd mirai-spot-base/src
npm install

```

### Step 2: 外部サービスのAPIキー取得（Bring Your Own Key）

ローカル開発用に、以下の無料アカウントを各自で作成し、キーを取得してください。

* **Mapbox**: [Mapbox Access Token](https://www.mapbox.com/)
* **Cloudflare R2**: [Cloudflare Dashboard](https://dash.cloudflare.com/)

### Step 3: 環境変数の設定

`src/` ディレクトリに `.env.local` を `.env.local.example` をベースに作成し、以下の内容を設定します。

### Step 4: Supabaseのローカル起動とスキーマ適用

Dockerが起動していることを確認し、`10_speech_spot_app/02_value_creation/src` ディレクトリで以下のコマンドを実行します。

```bash
cd 10_speech_spot_app/02_value_creation/src
npx supabase start

```

起動時、`10_speech_spot_app/02_value_creation/src/supabase/migrations/` ディレクトリ内のSQLファイルが読み込まれ、自動的にデータベーススキーマが適用されます。

### Step 5: 開発サーバーの起動

```bash
cd 10_speech_spot_app/02_value_creation/src
npm run dev

```

`http://localhost:3000` にアクセスしてマップが表示されれば成功です！

## 5. Help Wanted! (現在募集している助け)

現在、以下の環境整備に協力してくれる仲間を探しています。これらに関するIssueやPRは大歓迎です！

* OSSとしての標準的なGitブランチ戦略とPRルールの策定
* `npm` から `pnpm` への移行の検討・実施
* （その他、より良い開発体験のための環境改善提案）
