import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface McpConfig {
  command: string;
  args: string[];
}

interface TestRunnerOptions {
  mcpConfig?: McpConfig;
  keepFiles?: boolean;
  showReport?: boolean;
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'error';
  output?: string;
  error?: string;
}

interface TestConfig {
  browser?: string;
}

interface Test {
  name: string;
  config?: TestConfig;
}

interface TestExecutionResult {
  exitCode: number;
  output: string;
}

/**
 * テスト実行を管理するコアクラス
 */
class TestRunner {
  private mcpConfig: McpConfig;
  private keepFiles: boolean;
  private showReport: boolean;
  private testResults: TestResult[];
  private testFiles: string[];

  /**
   * TestRunnerを初期化
   * @param options - 設定オプション
   */
  constructor(options: TestRunnerOptions = {}) {
    this.mcpConfig = options.mcpConfig || {
      command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['playwright', 'test']
    };
    this.keepFiles = options.keepFiles || false;
    this.showReport = options.showReport !== false; // デフォルトはtrue
    this.testResults = [];
    this.testFiles = []; // 生成したテストファイルを追跡
  }

  /**
   * テストを実行
   * @param test - テスト定義
   * @param testFile - 生成されたテストファイルパス
   * @returns テスト結果
   */
  async execute(test: Test, testFile?: string): Promise<TestResult> {
    console.log(`テスト「${test.name}」を実行中...`);
    
    if (testFile) {
      this.testFiles.push(testFile);
    }
    
    try {
      // 引数にレポーター設定を追加（必要な場合）
      const mcpArgs = [...this.mcpConfig.args];
      
      // headlessオプションを修正（--headlessは使用しない）
      const headedIndex = mcpArgs.indexOf('--headless');
      if (headedIndex > -1) {
        mcpArgs.splice(headedIndex, 1);
      }
      
      if (!this.showReport) {
        mcpArgs.push('--reporter=null');
      }
      
      // ブラウザプロジェクトを明示的に指定
      if (test.config && test.config.browser) {
        const projectArg = `--project=${test.config.browser}`;
        if (!mcpArgs.some(arg => arg.startsWith('--project='))) {
          mcpArgs.push(projectArg);
        }
      } else {
        // デフォルトのプロジェクトを指定
        if (!mcpArgs.some(arg => arg.startsWith('--project='))) {
          mcpArgs.push('--project=chromium');
        }
      }
      
      // MCPを使用してテストを実行
      const result = await this._runPlaywrightTest(mcpArgs);
      
      // テスト失敗時にレポートを表示（オプションが有効な場合）
      if (result.exitCode !== 0 && this.showReport) {
        console.log('テストレポートを表示します...');
        const reportProcess = spawn(
          this.mcpConfig.command, 
          ['playwright', 'show-report'], 
          { stdio: 'inherit', shell: process.platform === 'win32' }
        );
        
        await new Promise<void>((resolve) => {
          reportProcess.on('close', () => resolve());
        });
      }
      
      // 結果を保存
      this.testResults.push({
        name: test.name,
        status: result.exitCode === 0 ? 'passed' : 'failed',
        output: result.output
      });
      
      console.log(`テスト「${test.name}」が完了しました`);
      return this.testResults[this.testResults.length - 1];
    } catch (error: any) {
      console.error(`テスト「${test.name}」の実行中にエラーが発生しました:`, error);
      this.testResults.push({
        name: test.name,
        status: 'error',
        error: error.message
      });
      return this.testResults[this.testResults.length - 1];
    }
  }

  /**
   * Playwrightテストを実行
   * @param args - 追加コマンド引数
   * @returns 実行結果
   * @private
   */
  private _runPlaywrightTest(args: string[] = []): Promise<TestExecutionResult> {
    return new Promise((resolve, reject) => {
      const { command, args: baseArgs } = this.mcpConfig;
      const mergedArgs = [...baseArgs, ...args];
      console.log(`実行コマンド: ${command} ${mergedArgs.join(' ')}`);
      
      // Playwrightテスト実行
      const testProcess = spawn(command, mergedArgs, {
        shell: process.platform === 'win32'
      });
      
      let outputData = '';
      
      testProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        outputData += output;
        console.log(output);
      });
      
      testProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        outputData += output;
        console.error(output);
      });
      
      testProcess.on('close', (exitCode) => {
        resolve({ exitCode: exitCode || 0, output: outputData });
      });
      
      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * テスト結果のサマリーを取得
   * @returns 結果サマリー
   */
  getResultsSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(result => result.status === 'passed').length;
    const failed = this.testResults.filter(result => result.status === 'failed').length;
    const errors = this.testResults.filter(result => result.status === 'error').length;
    
    return {
      total,
      passed,
      failed,
      errors,
      success: total > 0 ? (passed / total) * 100 : 0
    };
  }
  
  /**
   * 生成されたテストファイルをクリーンアップ
   * @returns void
   */
  async cleanup(): Promise<void> {
    if (this.keepFiles) {
      console.log('テストファイルを保持します');
      return;
    }
    
    for (const file of this.testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`テストファイルを削除しました: ${file}`);
      }
    }
    
    this.testFiles = [];
  }
}

export default TestRunner; 