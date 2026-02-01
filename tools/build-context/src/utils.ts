// build-context ツール: 補助関数群

import * as fs from 'fs/promises';
import * as path from 'path';

type BuildContextConfig = {
  targets: {
    [key: string]: {
      sources: string[];
    };
  };
  extensionsToProcess: string[];
};

type ToolConfig = {
  output: {
    context: {
      [key: string]: string;
    };
  };
  artifacts?: {
    gemContextPath?: string;
  };
};

async function readBuildContextConfig(configPath: string): Promise<BuildContextConfig> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    
    // 既存の設定ファイルフォーマットから新しいフォーマットに変換
    if (config.sourcePaths && !config.targets) {
      // 既存フォーマットを新フォーマットに変換
      return {
        targets: {
          tool: { sources: config.sourcePaths },
          upstream: { sources: config.sourcePaths }
        },
        extensionsToProcess: config.extensionsToProcess || ['.md']
      };
    }
    
    if (!config.targets) {
      throw new Error('設定ファイルに targets プロパティが見つかりません');
    }
    
    return config;
  } catch (err) {
    console.error('❌ 致命的エラー: build-context設定ファイルの読み込みに失敗しました:', err);
    process.exit(1);
  }
}

async function readToolConfig(configPath: string): Promise<ToolConfig> {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);
    
    // 既存の設定ファイルフォーマットから新しいフォーマットに変換
    if (config.artifacts && config.artifacts.gemContextPath && !config.output) {
      return {
        output: {
          context: {
            tool: config.artifacts.gemContextPath,
            upstream: config.artifacts.gemContextPath
          }
        },
        artifacts: config.artifacts
      };
    }
    
    if (!config.output || !config.output.context) {
      console.error('❌ 致命的エラー: tools/tool-config.json に output.context が設定されていません。');
      process.exit(1);
    }
    
    return config;
  } catch (err) {
    console.error('❌ 致命的エラー: tools/tool-config.json の読み込みに失敗しました:', err);
    process.exit(1);
  }
}

async function getFilesFromDir(dir: string, exts: string[]): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    let allFiles: string[] = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && exts.includes(path.extname(entry.name))) {
        allFiles.push(fullPath);
      } else if (entry.isDirectory()) {
        // 再帰的にディレクトリを探索
        const subFiles = await getFilesFromDir(fullPath, exts);
        allFiles = allFiles.concat(subFiles);
      }
    }
    
    // localeCompareのnumericオプションを使用した自然順ソート
    return allFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  } catch (err) {
    console.warn(`⚠️ 警告: ディレクトリ ${dir} の読み込みに失敗しました:`, err);
    return [];
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function processSourcesAndBuildContext(targetType?: string) {
  // ワークスペースのルートディレクトリを取得
  const workspaceRoot = path.resolve(__dirname, '../../..');
  // config.jsonはツールディレクトリ直下
  const configPath = path.resolve(__dirname, '../config.json');
  // tool-config.jsonはtoolsディレクトリ直下
  const toolConfigPath = path.resolve(__dirname, '../../tool-config.json');
  
  const buildContextConfig = await readBuildContextConfig(configPath);
  const toolConfig = await readToolConfig(toolConfigPath);

  // 処理対象のターゲットを決定
  let targetsToProcess: string[];
  if (targetType) {
    if (!buildContextConfig.targets[targetType]) {
      console.error(`❌ 指定されたターゲット '${targetType}' は設定ファイルに存在しません。`);
      console.error(`利用可能なターゲット: ${Object.keys(buildContextConfig.targets).join(', ')}`);
      process.exit(1);
    }
    targetsToProcess = [targetType];
  } else {
    // デフォルトでは設定ファイルに定義されているすべてのターゲットを処理
    targetsToProcess = Object.keys(buildContextConfig.targets).filter(key => 
      buildContextConfig.targets[key].sources.length > 0
    );
  }

  // 各ターゲットを処理
  for (const target of targetsToProcess) {
    await processTarget(target, buildContextConfig, toolConfig, workspaceRoot);
  }
}

async function processTarget(
  target: string,
  buildContextConfig: BuildContextConfig,
  toolConfig: ToolConfig,
  workspaceRoot: string
) {
  const targetConfig = buildContextConfig.targets[target];
  const outputPath = toolConfig.output.context[target];
  
  if (!outputPath) {
    console.error(`❌ ターゲット '${target}' の出力パスが tool-config.json に設定されていません。`);
    return;
  }

  let merged = '';
  for (const src of targetConfig.sources) {
    // config.jsonのsources内のパスはワークスペースルートからのパスとして扱う
    const absSrc = path.resolve(workspaceRoot, src);
    if (!(await fileExists(absSrc))) {
      console.warn(`⚠️ 警告: ${src} は見つからなかったため、スキップします。`);
      continue;
    }
    
    const stat = await fs.stat(absSrc);
    if (stat.isFile()) {
      merged += await fileWithHeader(absSrc, src);
    } else if (stat.isDirectory()) {
      const files = await getFilesFromDir(absSrc, buildContextConfig.extensionsToProcess);
      for (const f of files) {
        // ワークスペースルートからの相対パスを再現
        const rel = path.relative(workspaceRoot, f);
        merged += await fileWithHeader(f, rel);
      }
    }
  }

  const outPath = path.resolve(workspaceRoot, outputPath);
  try {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, merged, 'utf-8');
    console.log(`✅ Context '${target}' built successfully: ${outputPath}`);
  } catch (err) {
    console.error(`❌ ターゲット '${target}' の出力ファイルの書き込みに失敗しました:`, err);
    process.exit(1);
  }
}

async function fileWithHeader(absPath: string, relPath: string): Promise<string> {
  let content = '';
  try {
    content = await fs.readFile(absPath, 'utf-8');
  } catch (err) {
    return `⚠️ 警告: ${relPath} の読み込みに失敗しました。\n`;
  }
  return `--- Start of ${relPath} ---\n${content}\n--- End of ${relPath} ---\n`;
}
