/**
 * Playwright MCPを活用したE2Eテストプラットフォーム
 * メインエントリポイント
 */

import TestRunner from './core/TestRunner';
import * as testMcp from './test-mcp';

// テストMCP関連の処理をエクスポート
export { testMcp, TestRunner };
