import { Page } from '@playwright/test';

interface McpOptions {
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
  [key: string]: any;
}

interface McpPage extends Page {
  mcp?: {
    run: (task: string, options: McpOptions) => Promise<string>;
    init?: () => Promise<void>;
    cleanup?: () => Promise<void>;
  };
}

interface McpResult {
  success: boolean;
  message: string;
  error?: string;
  retries?: number;
}

/**
 * Playwright MCPを使用するためのヘルパー関数
 * @param page - Playwrightのページオブジェクト
 * @param task - MCPに実行させるタスク
 * @param options - MCPのオプション
 * @returns - MCPの実行結果
 */
export async function runMcp(
  page: McpPage,
  task: string,
  options: McpOptions = {}
): Promise<McpResult> {
  try {
    // MCPが利用可能か確認
    if (!page.mcp) {
      console.warn(
        'Playwright MCPを初期化できませんでした。ネイティブアクションにフォールバックします。'
      );
      // フォールバック処理を実行
      return await executeNativeAction(page, task);
    }

    // デフォルトオプション
    const defaultOptions: McpOptions = {
      model: 'gpt-4o',
      temperature: 0.7,
      timeoutMs: 60000,
      maxRetries: 3,
      retryDelay: 1000,
      debug: false,
    };

    // オプションをマージ
    const mergedOptions = { ...defaultOptions, ...options };

    // MCPを実行
    console.log(`MCPタスクを実行: ${task}`);

    try {
      if (page.mcp && page.mcp.run) {
        const result = await page.mcp.run(task, mergedOptions);
        return {
          success: true,
          message: result,
        };
      } else {
        // フォールバック処理を実行
        return await executeNativeAction(page, task);
      }
    } catch (error) {
      console.error('MCPタスク実行中にエラーが発生しました:', error);
      // エラー発生時もフォールバック処理を試行
      return await executeNativeAction(page, task);
    }
  } catch (error) {
    console.error('MCP実行準備中にエラーが発生しました:', error);
    return await executeNativeAction(page, task);
  }
}

/**
 * ネイティブなPlaywright操作を使用してタスクを実行するフォールバック関数
 * @param page - Playwrightのページオブジェクト
 * @param task - 実行するタスクの説明
 * @returns - 操作結果
 */
async function executeNativeAction(page: Page, task: string): Promise<McpResult> {
  console.log(`ネイティブアクションにフォールバック: ${task}`);

  try {
    // クリック操作
    if (task.includes('をクリックする')) {
      const elementMatch = task.match(/要素\s+["'](.+?)["']\s+をクリック/);
      if (elementMatch && elementMatch[1]) {
        const selector = elementMatch[1];
        await page.click(selector);
        return {
          success: true,
          message: `要素 "${selector}" をクリックしました`,
        };
      }
    }

    // テキスト入力
    if (task.includes('と入力する')) {
      const elementMatch = task.match(/要素\s+["'](.+?)["']\s+に\s+["'](.+?)["']\s+と入力する/);
      if (elementMatch && elementMatch[1] && elementMatch[2]) {
        const selector = elementMatch[1];
        const text = elementMatch[2];
        await page.fill(selector, text);

        // Enterキーを押す
        if (task.includes('そしてEnterキーを押す') || task.includes('Enterを押す')) {
          await page.press(selector, 'Enter');
          return {
            success: true,
            message: `要素 "${selector}" に "${text}" を入力し、Enterを押しました`,
          };
        }

        return {
          success: true,
          message: `要素 "${selector}" に "${text}" を入力しました`,
        };
      }
    }

    // 要素の数を確認
    if (task.includes('個存在することを確認する')) {
      const elementMatch = task.match(/要素\s+["'](.+?)["']\s+が\s+(\d+)\s+個存在する/);
      if (elementMatch && elementMatch[1] && elementMatch[2]) {
        const selector = elementMatch[1];
        const count = parseInt(elementMatch[2], 10);

        // 要素が表示されるまで少し待機
        await page.waitForTimeout(1000);

        const actualCount = await page.locator(selector).count();
        if (actualCount === count) {
          return {
            success: true,
            message: `要素 "${selector}" が ${count} 個存在することを確認しました`,
          };
        } else {
          return {
            success: false,
            message: `要素 "${selector}" は ${actualCount} 個存在します (期待値: ${count})`,
          };
        }
      }
    }

    // 要素が表示されるか確認
    if (
      task.includes('が表示されていることを確認する') ||
      task.includes('が表示されるまで待機する')
    ) {
      const elementMatch = task.match(/要素\s+["'](.+?)["']\s+が表示/);
      if (elementMatch && elementMatch[1]) {
        const selector = elementMatch[1];
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        return {
          success: true,
          message: `要素 "${selector}" が表示されていることを確認しました`,
        };
      }
    }

    // テキストの内容を確認
    if (task.includes('のテキストが') && task.includes('であることを確認する')) {
      const elementMatch = task.match(
        /要素\s+["'](.+?)["']\s+のテキストが\s+["'](.+?)["']\s+であることを確認する/
      );
      if (elementMatch && elementMatch[1] && elementMatch[2]) {
        const selector = elementMatch[1];
        const expectedText = elementMatch[2];

        const actualText = await page.locator(selector).textContent();
        if (actualText && actualText.includes(expectedText)) {
          return {
            success: true,
            message: `要素 "${selector}" のテキストが "${expectedText}" であることを確認しました`,
          };
        } else {
          return {
            success: false,
            message: `要素 "${selector}" のテキストは "${actualText}" です (期待値: "${expectedText}")`,
          };
        }
      }
    }

    // 未対応のタスク
    return {
      success: false,
      message: `タスク「${task}」はネイティブアクションではサポートされていません`,
    };
  } catch (error: any) {
    console.error('ネイティブアクション実行中にエラーが発生しました:', error);
    return {
      success: false,
      message: `ネイティブアクションでエラーが発生しました: ${error.message}`,
      error: error.message,
    };
  }
}

interface SnapshotElement {
  name?: string;
  role?: string;
  children?: SnapshotElement[];
  [key: string]: any;
}

/**
 * スナップショット内の要素を検索するヘルパー関数
 * @param elements - スナップショット内の要素配列
 * @param taskDescription - タスクの説明
 * @returns - 見つかった要素または null
 */
function findElementInSnapshot(
  elements: SnapshotElement[] | undefined,
  taskDescription: string
): SnapshotElement | null {
  if (!elements || elements.length === 0) return null;

  const keywords = taskDescription.toLowerCase().split(' ');

  for (const element of elements) {
    // 要素の名前やロールがタスク説明と一致するか確認
    const name = (element.name || '').toLowerCase();
    const role = (element.role || '').toLowerCase();

    if (keywords.some((keyword) => name.includes(keyword) || role.includes(keyword))) {
      return element;
    }

    // 子要素を再帰的に検索
    if (element.children && element.children.length > 0) {
      const childMatch = findElementInSnapshot(element.children, taskDescription);
      if (childMatch) return childMatch;
    }
  }

  return null;
}
