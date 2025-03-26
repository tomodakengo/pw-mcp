/**
 * Playwright MCPを活用したE2Eテストプラットフォーム
 * メインエントリポイント
 */

const TestRunner = require('./core/TestRunner');

// テストMCP関連の処理をエクスポート
module.exports = {
  testMcp: require('./test-mcp.js'),
  TestRunner
}; 