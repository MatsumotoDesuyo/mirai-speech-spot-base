// build-context ツール: エントリーポイント

import { processSourcesAndBuildContext } from './utils';

// コマンドライン引数の解析
function parseArguments(): { targetType?: string } {
  const args = process.argv.slice(2);
  let targetType: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && i + 1 < args.length) {
      targetType = args[i + 1];
      break;
    }
  }

  return { targetType };
}

// エントリーポイント関数
async function main() {
  try {
    const { targetType } = parseArguments();
    
    // 1. 設定ファイル(config.json)の読み込み
    // 2. 指定されたファイル・ディレクトリの走査と内容統合
    // 3. 統合結果を出力ファイルに書き出し
    // 4. 成功・警告・エラーのメッセージ出力
    await processSourcesAndBuildContext(targetType);
  } catch (error) {
    console.error('❌ 致命的エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行時にmain()を呼び出す
main();
