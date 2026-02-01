import * as path from 'path';
import { FileSystemUtils, ConfigLoader, ErrorMessages, SuccessMessages } from './utils';

/**
 * 同期ジョブの定義
 */
interface SyncJob {
    source: string;
    destination: string;
}

/**
 * sync-knowledgeツールのメインクラス
 * 統合コンテクストファイルを指定された複数の場所にコピーする機能を提供する
 */
class SyncKnowledgeTool {
    private readonly toolConfigPath: string;
    private readonly syncConfigPath: string;

    constructor() {
        // プロジェクトルートからの相対パスを設定
        this.toolConfigPath = path.resolve(__dirname, '../../tool-config.json');
        this.syncConfigPath = path.resolve(__dirname, '../config.json');
    }

    /**
     * 同期処理を実行する
     * 設定の読み込み、バリデーション、ファイルコピーを順次実行する
     */
    async execute(): Promise<void> {
        try {
            console.log('sync-knowledge: 知識ベースの同期を開始します...');

            // 設定ファイルの読み込み
            const { contextConfig, syncJobs } = this.loadConfigurations();

            // 同期ジョブの逐次処理
            for (const job of syncJobs) {
                await this.processSyncJob(job, contextConfig);
            }

            // 成功メッセージの表示
            console.log(SuccessMessages.ALL_SYNC_COMPLETED(syncJobs.length));

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`sync-knowledge: エラーが発生しました: ${errorMessage}`);
            process.exit(1);
        }
    }

    /**
     * 設定ファイルを読み込み、必要なパス情報を取得する
     * @returns コンテキスト設定と同期ジョブのオブジェクト
     */
    private loadConfigurations(): { contextConfig: any; syncJobs: SyncJob[] } {
        // tool-config.jsonからコンテキスト設定を取得
        const toolConfig = ConfigLoader.loadConfig(this.toolConfigPath);
        const contextConfig = ConfigLoader.getConfigValue(toolConfig, 'output.context');

        // sync-knowledge/config.jsonから同期ジョブを取得
        const syncConfig = ConfigLoader.loadConfig(this.syncConfigPath);
        const syncJobs = ConfigLoader.getConfigValue(syncConfig, 'syncJobs') as SyncJob[];

        return { contextConfig, syncJobs };
    }

    /**
     * 単一の同期ジョブを処理する
     * @param job - 同期ジョブ
     * @param contextConfig - コンテキスト設定
     */
    private async processSyncJob(job: SyncJob, contextConfig: any): Promise<void> {
        console.log(`sync-knowledge: ジョブを処理中... source: ${job.source}, destination: ${job.destination}`);

        // sourceキーがcontextConfigに存在するかチェック
        if (!(job.source in contextConfig)) {
            throw new Error(ErrorMessages.SOURCE_KEY_NOT_FOUND(job.source));
        }

        // コピー元パスを取得し、絶対パスに変換
        const relativePath = contextConfig[job.source];
        const sourcePath = path.resolve(__dirname, '../../..', relativePath);

        // バリデーション
        this.validateSourceFile(sourcePath);
        this.validateDestinationPath(job.destination);

        // ファイルコピーの実行
        this.copyFileToDestination(sourcePath, job.destination);

        console.log(SuccessMessages.SYNC_JOB_COMPLETED(job.source, sourcePath, job.destination));
    }

    /**
     * コピー元ファイルのバリデーション
     * @param sourcePath - コピー元ファイルパス
     */
    private validateSourceFile(sourcePath: string): void {
        // コピー元ファイルの存在確認
        if (!FileSystemUtils.exists(sourcePath)) {
            throw new Error(ErrorMessages.SOURCE_FILE_NOT_FOUND(sourcePath));
        }

        // コピー元がファイルかどうかの確認
        if (!FileSystemUtils.isFile(sourcePath)) {
            throw new Error(ErrorMessages.SOURCE_NOT_FILE(sourcePath));
        }
    }

    /**
     * コピー先パスのバリデーション
     * @param destinationPath - コピー先ファイルパス
     */
    private validateDestinationPath(destinationPath: string): void {
        const destinationDir = path.dirname(destinationPath);

        // コピー先ディレクトリの存在確認
        if (!FileSystemUtils.exists(destinationDir)) {
            throw new Error(ErrorMessages.DESTINATION_DIR_NOT_FOUND(destinationDir));
        }

        // コピー先がディレクトリかどうかの確認
        if (!FileSystemUtils.isDirectory(destinationDir)) {
            throw new Error(ErrorMessages.DESTINATION_NOT_DIRECTORY(destinationDir));
        }
    }

    /**
     * ファイルコピーを実行する
     * @param sourcePath - コピー元ファイルパス
     * @param destinationPath - コピー先ファイルパス
     */
    private copyFileToDestination(sourcePath: string, destinationPath: string): void {
        try {
            FileSystemUtils.copyFileToPath(sourcePath, destinationPath);
        } catch (error) {
            throw new Error(ErrorMessages.COPY_FAILED(sourcePath, destinationPath));
        }
    }
}

/**
 * ツールのエントリーポイント
 * SyncKnowledgeToolのインスタンスを作成し、実行する
 */
async function main(): Promise<void> {
    const tool = new SyncKnowledgeTool();
    await tool.execute();
}

// スクリプトが直接実行された場合のみmain関数を呼び出す
if (require.main === module) {
    main().catch((error) => {
        console.error('予期しないエラーが発生しました:', error);
        process.exit(1);
    });
}