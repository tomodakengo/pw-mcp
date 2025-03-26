/**
 * Playwright MCPを使用するためのヘルパー関数
 * @param {Object} page - Playwrightのページオブジェクト
 * @param {string} task - MCPに実行させるタスク
 * @param {Object} options - MCPのオプション
 * @returns {Promise<string>} - MCPの実行結果
 */
async function runMcp(page, task, options = {}) {
  try {
    // MCPが利用可能か確認
    if (!page.mcp) {
      throw new Error('Playwright MCPが初期化されていません。@playwright/mcpをインポートして初期化してください。');
    }
    
    // デフォルトオプション
    const defaultOptions = {
      model: 'gpt-4o',
      temperature: 0.7,
      timeoutMs: 60000
    };
    
    // オプションをマージ
    const mergedOptions = { ...defaultOptions, ...options };
    
    // MCPを実行
    console.log(`MCPタスクを実行: ${task}`);
    const result = await page.mcp.run(task, mergedOptions);
    
    return result;
  } catch (error) {
    console.error('MCP実行中にエラーが発生しました:', error);
    throw error;
  }
}

module.exports = {
  runMcp
}; 