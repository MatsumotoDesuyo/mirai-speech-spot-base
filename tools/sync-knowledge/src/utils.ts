import * as fs from 'fs';
import * as path from 'path';

/**
 * ファイルシステム操作を管理するユーティリティクラス
 * ファイルの存在確認、読み込み、コピーなどの操作を提供する
 */
export class FileSystemUtils {
    /**
     * ファイルまたはディレクトリの存在確認
     * @param targetPath - 確認対象のパス
     * @returns 存在する場合true、しない場合false
     */
    static exists(targetPath: string): boolean {
        return fs.existsSync(targetPath);
    }

    /**
     * ファイルをコピーする
     * @param sourcePath - コピー元ファイルパス
     * @param destinationDir - コピー先ディレクトリパス
     * @returns コピー後のファイルパス
     */
    static copyFile(sourcePath: string, destinationDir: string): string {
        const fileName = path.basename(sourcePath);
        const destinationPath = path.join(destinationDir, fileName);
        
        fs.copyFileSync(sourcePath, destinationPath);
        return destinationPath;
    }

    /**
     * ファイルを指定されたパスにコピーする
     * @param sourcePath - コピー元ファイルパス
     * @param destinationPath - コピー先ファイルパス（ファイル名を含む完全パス）
     */
    static copyFileToPath(sourcePath: string, destinationPath: string): void {
        fs.copyFileSync(sourcePath, destinationPath);
    }

    /**
     * パスがファイルかディレクトリかを判定する
     * @param targetPath - 判定対象のパス
     * @returns ファイルの場合true、ディレクトリの場合false
     */
    static isFile(targetPath: string): boolean {
        return fs.statSync(targetPath).isFile();
    }

    /**
     * パスがディレクトリかを判定する
     * @param targetPath - 判定対象のパス
     * @returns ディレクトリの場合true、ファイルの場合false
     */
    static isDirectory(targetPath: string): boolean {
        return fs.statSync(targetPath).isDirectory();
    }
}

/**
 * JSON設定ファイルの読み込みを管理するユーティリティクラス
 * 設定ファイルの読み込みとバリデーションを提供する
 */
export class ConfigLoader {
    /**
     * JSON設定ファイルを読み込む
     * @param configPath - 設定ファイルのパス
     * @returns パースされた設定オブジェクト
     */
    static loadConfig(configPath: string): any {
        if (!FileSystemUtils.exists(configPath)) {
            throw new Error(`設定ファイルが見つかりません: ${configPath}`);
        }

        try {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(configContent);
        } catch (error) {
            throw new Error(`設定ファイルの読み込みに失敗しました: ${configPath}. エラー: ${error}`);
        }
    }

    /**
     * 設定オブジェクトから指定されたキーの値を取得する
     * @param config - 設定オブジェクト
     * @param keyPath - 取得するキーのパス（例: "artifacts.gemContextPath"）
     * @returns キーの値
     */
    static getConfigValue(config: any, keyPath: string): any {
        const keys = keyPath.split('.');
        let value = config;

        for (const key of keys) {
            if (value === null || value === undefined || !(key in value)) {
                throw new Error(`設定キー '${keyPath}' が見つかりません`);
            }
            value = value[key];
        }

        return value;
    }
}

/**
 * エラーメッセージの管理を行うユーティリティクラス
 * 一貫したエラーメッセージの生成を提供する
 */
export class ErrorMessages {
    static readonly CONFIG_FILE_NOT_FOUND = (path: string) => `設定ファイルが見つかりません: ${path}`;
    static readonly SOURCE_FILE_NOT_FOUND = (path: string) => `コピー元ファイルが見つかりません: ${path}`;
    static readonly DESTINATION_DIR_NOT_FOUND = (path: string) => `コピー先ディレクトリが見つかりません: ${path}`;
    static readonly DESTINATION_NOT_DIRECTORY = (path: string) => `コピー先がディレクトリではありません: ${path}`;
    static readonly SOURCE_NOT_FILE = (path: string) => `コピー元がファイルではありません: ${path}`;
    static readonly COPY_FAILED = (source: string, destination: string) => `ファイルのコピーに失敗しました: ${source} -> ${destination}`;
    static readonly SOURCE_KEY_NOT_FOUND = (sourceKey: string) => `指定されたソースキー '${sourceKey}' が tool-config.json の output.context 内に見つかりません`;
}

/**
 * 成功メッセージの管理を行うユーティリティクラス
 * 一貫した成功メッセージの生成を提供する
 */
export class SuccessMessages {
    static readonly SYNC_COMPLETED = (source: string, destination: string) => 
        `知識ベースの同期が完了しました。\nコピー元: ${source}\nコピー先: ${destination}`;
    
    static readonly SYNC_JOB_COMPLETED = (sourceKey: string, sourcePath: string, destination: string) =>
        `同期ジョブが完了しました。\nソースキー: ${sourceKey}\nコピー元: ${sourcePath}\nコピー先: ${destination}`;
    
    static readonly ALL_SYNC_COMPLETED = (jobCount: number) =>
        `すべての知識ベース同期が完了しました。実行されたジョブ数: ${jobCount}`;
}