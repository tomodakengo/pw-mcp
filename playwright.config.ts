import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright の設定
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* テスト実行のタイムアウト（ミリ秒） */
  timeout: 30000,
  
  /* テスト実行環境 */
  fullyParallel: true,
  
  /* レポート設定 */
  reporter: 'html',
  
  /* レポート作成条件: always（常に）, on-failure（失敗時のみ）, never（作成しない） */
  reportSlowTests: { max: 0, threshold: 60000 },
  
  /* MCP関連のコンフィグ */
  use: {
    /* ベースURL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* テスト実行ごとにトレース取得 */
    trace: 'on-first-retry',
    
    /* テスト実行ごとにスクリーンショット取得 */
    screenshot: 'only-on-failure',
  },
  
  /* テスト実行環境の設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* モバイル環境向け */
    {
      name: 'mobile_chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile_safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
}); 