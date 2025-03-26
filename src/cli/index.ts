#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { spawnSync, spawn, SpawnSyncReturns } from 'child_process';
import TestRunner from '../core/TestRunner';

interface TestDefinition {
  name: string;
  steps: TestStep[];
}

interface TestStep {
  action: string;
  description?: string;
  url?: string;
  element?: string;
  seconds?: number;
  text?: string;
  submit?: boolean;
  expect?: string;
  value?: number | string;
}

// バージョン情報を取得
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));

// CLIを設定
program
  .name('pw-mcp')
  .description('Playwright MCPを活用したE2Eテストプラットフォーム')
  .version(packageJson.version || '0.1.0');

// テスト実行コマンド
program
  .command('run')
  .description('テストを実行')
  .argument('<file>', 'テスト定義ファイルのパス（JSON形式）')
  .option('-b, --browser <browser>', 'ブラウザを指定 (chromium, firefox, webkit)', 'chromium')
  .option('--headless', 'ヘッドレスモードで実行', false)
  .option('--headed', 'ヘッド付きモードで実行（UIあり）', false)
  .option('--timeout <ms>', 'テストのタイムアウト時間（ミリ秒）', '30000')
  .option('--model <model>', 'MCPで使用するAIモデル', 'gpt-4o')
  .option('--keep-files', 'テスト完了後もspec.jsファイルを保持する', false)
  .option('--no-report', 'テスト失敗時にレポートを自動表示しない', false)
  .action(async (file: string, options: any) => {
    try {
      console.log('テスト実行を開始します...');
      console.log(`ファイル: ${file}`);
      console.log(`オプション: ${JSON.stringify(options, null, 2)}`);
      
      // テスト定義ファイルを読み込む
      const testDefinitionPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(testDefinitionPath)) {
        console.error(`エラー: ファイル '${testDefinitionPath}' が存在しません`);
        process.exit(1);
      }
      
      // テスト定義からJavaScriptテストファイルを生成
      const testDefinition: TestDefinition = JSON.parse(fs.readFileSync(testDefinitionPath, 'utf8'));
      const jsTestFile = await generateJsTestFromDefinition(testDefinition);
      
      console.log(`テストファイルを生成しました: ${jsTestFile}`);
      
      // テストランナーを設定
      const testRunner = new TestRunner({
        mcpConfig: {
          command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
          args: [
            'playwright',
            'test',
            jsTestFile.replace(/\\/g, '/'),
            options.headed ? '--headed' : ''
          ].filter(Boolean)
        },
        keepFiles: options.keepFiles,
        showReport: options.report
      });
      
      // テストを実行
      const result = await testRunner.execute(testDefinition, jsTestFile);
      
      // テスト結果を表示
      console.log('\nテスト実行結果:');
      console.log(`ステータス: ${result.status}`);
      
      // テストファイルをクリーンアップ
      await testRunner.cleanup();
      
      // 終了コードを設定
      process.exit(result.status === 'passed' ? 0 : 1);
    } catch (error) {
      console.error('テスト実行中にエラーが発生しました:', error);
      process.exit(1);
    }
  });

// JSON定義からJavaScriptテストファイルを生成する関数
async function generateJsTestFromDefinition(testDefinition: TestDefinition): Promise<string> {
  const testDir = path.join(process.cwd(), 'tests');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFileName = path.join(testDir, `test_${Date.now()}.spec.js`);
  let testCode = `// Generated test for ${testDefinition.name || "Todoアプリのテスト"}
const { test, expect } = require('@playwright/test');

test('${testDefinition.name || "Todoアプリのテスト"}', async ({ page }) => {
`;

  // ステップを変換
  for (const step of testDefinition.steps) {
    switch (step.action) {
      case 'navigate':
        testCode += `  // ${step.description || 'ページに移動'}\n`;
        testCode += `  await page.goto('${step.url}');\n`;
        break;
        
      case 'wait':
        if (step.seconds) {
          testCode += `  // ${step.description || `${step.seconds}秒待機`}\n`;
          testCode += `  await page.waitForTimeout(${step.seconds * 1000});\n`;
        } else if (step.element) {
          testCode += `  // ${step.description || '要素が表示されるまで待機'}\n`;
          testCode += `  await page.waitForSelector('${step.element}');\n`;
        }
        break;
        
      case 'type':
        testCode += `  // ${step.description || 'テキストを入力'}\n`;
        testCode += `  await page.locator('${step.element}').fill('${step.text}');\n`;
        if (step.submit) {
          testCode += `  await page.keyboard.press('Enter');\n`;
        }
        break;
        
      case 'click':
        testCode += `  // ${step.description || '要素をクリック'}\n`;
        testCode += `  await page.locator('${step.element}').click();\n`;
        break;
        
      case 'assertion':
        testCode += `  // ${step.description || '検証'}\n`;
        if (step.expect === 'count') {
          testCode += `  await expect(page.locator('${step.element}')).toHaveCount(${step.value});\n`;
        } else if (step.expect === 'visible') {
          testCode += `  await expect(page.locator('${step.element}')).toBeVisible();\n`;
        } else if (step.expect === 'text') {
          testCode += `  await expect(page.locator('${step.element}')).toHaveText('${step.value}');\n`;
        }
        break;
    }
  }
  
  testCode += `});`;
  
  fs.writeFileSync(testFileName, testCode, 'utf8');
  return testFileName;
}

// 例テスト生成コマンド
program
  .command('generate-example')
  .description('サンプルテスト定義ファイルを生成')
  .option('-o, --output <path>', 'ファイルの出力先', './example-test.json')
  .action((options: { output: string }) => {
    const exampleTest: TestDefinition = {
      name: 'ログインテスト例',
      steps: [
        { action: 'navigate', url: 'https://example.com/login' },
        { action: 'type', element: 'ユーザー名フィールド', text: 'testuser' },
        { action: 'type', element: 'パスワードフィールド', text: 'password', submit: true },
        { action: 'assertion', expect: 'ダッシュボード画面が表示される' }
      ]
    };
    
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, JSON.stringify(exampleTest, null, 2), 'utf8');
    
    console.log(`サンプルテスト定義を作成しました: ${outputPath}`);
  });

// 標準的なPlaywrightテスト実行コマンド
program
  .command('pw-test')
  .description('標準的なPlaywrightテストを実行')
  .argument('<file>', 'テストファイルのパス')
  .option('-b, --browser <browser>', 'ブラウザを指定 (chromium, firefox, webkit)', 'chromium')
  .option('--headed', 'ヘッド付きモードで実行（UIあり）', false)
  .action((file: string, options: { browser: string, headed: boolean }) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      'playwright',
      'test',
      file,
      `--project=${options.browser}`,
      options.headed ? '--headed' : ''
    ].filter(Boolean);
    
    console.log(`コマンド実行: ${command} ${args.join(' ')}`);
    
    const result = spawnSync(command, args, { 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    process.exit(result.status || 0);
  });

// MCPモデル情報表示コマンド
program
  .command('list-models')
  .description('使用可能なMCPモデルを表示')
  .action(() => {
    console.log('利用可能なMCPモデル:');
    console.log('- gpt-4o (OpenAI GPT-4o)');
    console.log('- claude-3-haiku (Anthropic Claude Haiku)');
    console.log('- claude-3-sonnet (Anthropic Claude Sonnet)');
    console.log('- claude-3-opus (Anthropic Claude Opus)');
  });

// MCPを使用したテスト実行コマンド
program
  .command('mcp')
  .description('MCP（AI）を使ったテストを実行')
  .argument('<file>', 'テスト定義ファイルのパス（JSON形式）')
  .option('-m, --model <model>', 'AIモデルを指定', 'gpt-4o')
  .option('-b, --browser <browser>', 'ブラウザを指定 (chromium, firefox, webkit)', 'chromium')
  .option('--headed', 'ヘッド付きモードで実行（UIあり）', true)
  .option('--keep-files', 'テスト完了後もspec.jsファイルを保持する', false)
  .action(async (file: string, options: any) => {
    try {
      console.log('MCP（AI）テスト実行を開始します...');
      console.log(`ファイル: ${file}`);
      console.log(`モデル: ${options.model}`);
      
      // テスト定義ファイルを読み込む
      const testDefinitionPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(testDefinitionPath)) {
        console.error(`エラー: ファイル '${testDefinitionPath}' が存在しません`);
        process.exit(1);
      }
      
      // テスト定義からMCPテストファイルを生成
      const testDefinition: TestDefinition = JSON.parse(fs.readFileSync(testDefinitionPath, 'utf8'));
      const mcpTestFile = await generateMcpTestFromDefinition(testDefinition, options.model);
      
      console.log(`MCPテストファイルを生成しました: ${mcpTestFile}`);
      
      // テストランナーを設定
      const testRunner = new TestRunner({
        mcpConfig: {
          command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
          args: [
            'playwright',
            'test',
            mcpTestFile.replace(/\\/g, '/'),
            `--project=${options.browser}`,
            options.headed ? '--headed' : ''
          ].filter(Boolean)
        },
        keepFiles: options.keepFiles
      });
      
      // テストを実行
      const result = await testRunner.execute(testDefinition, mcpTestFile);
      
      // テスト結果を表示
      console.log('\nMCPテスト実行結果:');
      console.log(`ステータス: ${result.status}`);
      
      // テストファイルをクリーンアップ
      await testRunner.cleanup();
      
      // 終了コードを設定
      process.exit(result.status === 'passed' ? 0 : 1);
    } catch (error) {
      console.error('MCPテスト実行中にエラーが発生しました:', error);
      process.exit(1);
    }
  });

// 1種類のモデルタイプに変換する関数
function convertModelType(model: string): string {
  const lowercase = model.toLowerCase();
  
  if (lowercase.includes('gpt-4')) return 'gpt-4o';
  if (lowercase.includes('claude') && lowercase.includes('haiku')) return 'claude-3-haiku';
  if (lowercase.includes('claude') && lowercase.includes('sonnet')) return 'claude-3-sonnet';
  if (lowercase.includes('claude') && lowercase.includes('opus')) return 'claude-3-opus';
  
  // デフォルトはGPT-4o
  return 'gpt-4o';
}

// JSON定義からMCPテストファイルを生成する関数
async function generateMcpTestFromDefinition(testDefinition: TestDefinition, model = 'gpt-4o'): Promise<string> {
  const testDir = path.join(process.cwd(), 'tests');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const modelType = convertModelType(model);
  const testFileName = path.join(testDir, `mcp_test_${Date.now()}.spec.js`);
  
  // MCP用のコードを生成
  let testCode = `// Generated MCP test for ${testDefinition.name || "MCPテスト"}
const { test, expect } = require('@playwright/test');
const { runMcp } = require('../dist/test-mcp');

test('${testDefinition.name || "MCPテスト"}', async ({ page }) => {
  // MCPを初期化
  // ブラウザページに対してMCP機能を有効化（プレースホルダー）
  
  // MCP実行のオプション
  const mcpOptions = {
    model: '${modelType}',
    temperature: 0.7,
    timeoutMs: 60000
  };

`;

  // ステップを変換
  for (const step of testDefinition.steps) {
    testCode += `  // ${step.description || step.action}\n`;
    
    switch (step.action) {
      case 'navigate':
        testCode += `  await page.goto('${step.url}');\n`;
        break;
        
      case 'wait':
        if (step.seconds) {
          testCode += `  await page.waitForTimeout(${step.seconds * 1000});\n`;
        } else if (step.element) {
          testCode += `  await runMcp(page, \`要素 "${step.element}" が表示されるまで待機する\`, mcpOptions);\n`;
        }
        break;
        
      case 'type':
        testCode += `  await runMcp(page, \`要素 "${step.element}" に "${step.text}" と入力する${step.submit ? ' そしてEnterキーを押す' : ''}\`, mcpOptions);\n`;
        break;
        
      case 'click':
        testCode += `  await runMcp(page, \`要素 "${step.element}" をクリックする\`, mcpOptions);\n`;
        break;
        
      case 'assertion':
        if (step.expect === 'count') {
          testCode += `  await runMcp(page, \`要素 "${step.element}" が ${step.value} 個存在することを確認する\`, mcpOptions);\n`;
        } else if (step.expect === 'visible') {
          testCode += `  await runMcp(page, \`要素 "${step.element}" が表示されていることを確認する\`, mcpOptions);\n`;
        } else if (step.expect === 'text') {
          testCode += `  await runMcp(page, \`要素 "${step.element}" のテキストが "${step.value}" であることを確認する\`, mcpOptions);\n`;
        } else {
          testCode += `  await runMcp(page, \`${step.description || step.expect}\`, mcpOptions);\n`;
        }
        break;
        
      default:
        testCode += `  await runMcp(page, \`${step.description || JSON.stringify(step)}\`, mcpOptions);\n`;
    }
    
    testCode += '\n';
  }
  
  testCode += `});`;
  
  fs.writeFileSync(testFileName, testCode, 'utf8');
  return testFileName;
}

// コマンドを解析して実行
program.parse(); 