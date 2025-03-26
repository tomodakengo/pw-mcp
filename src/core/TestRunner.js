const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * テスト実行を管理するコアクラス
 */
class TestRunner {
  /**
   * TestRunnerを初期化
   * @param {Object} options - 設定オプション
   * @param {Object} options.mcpConfig - Playwright MCP設定
   * @param {string} options.mcpConfig.command - 実行コマンド (npx等)
   * @param {string[]} options.mcpConfig.args - コマンド引数
   * @param {boolean} options.keepFiles - テスト完了後もspec.jsファイルを保持するかどうか
   * @param {boolean} options.showReport - テスト失敗時にレポートを自動表示するかどうか
   */
  constructor(options = {}) {
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
   * @param {Object} test - テスト定義
   * @param {string} testFile - 生成されたテストファイルパス
   * @returns {Promise<Object>} テスト結果
   */
  async execute(test, testFile) {
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
        
        await new Promise((resolve) => {
          reportProcess.on('close', resolve);
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
    } catch (error) {
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
   * @param {string[]} args - 追加コマンド引数
   * @returns {Promise<{exitCode: number, output: string}>} 実行結果
   * @private
   */
  _runPlaywrightTest(args = []) {
    return new Promise((resolve, reject) => {
      const { command, args: baseArgs } = this.mcpConfig;
      const mergedArgs = [...baseArgs, ...args];
      console.log(`実行コマンド: ${command} ${mergedArgs.join(' ')}`);
      
      // Playwrightテスト実行
      const testProcess = spawn(command, mergedArgs, {
        shell: process.platform === 'win32'
      });
      
      let outputData = '';
      
      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputData += output;
        console.log(output);
      });
      
      testProcess.stderr.on('data', (data) => {
        const output = data.toString();
        outputData += output;
        console.error(output);
      });
      
      testProcess.on('close', (exitCode) => {
        resolve({ exitCode, output: outputData });
      });
      
      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * テスト結果のサマリーを取得
   * @returns {Object} 結果サマリー
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
   * @returns {Promise<void>}
   */
  async cleanup() {
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

module.exports = TestRunner; 