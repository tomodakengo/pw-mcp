const { test } = require('@playwright/mcp');

// 基本的なテストシナリオを実行
test('TodoMVCで基本テスト', async ({ page }) => {
  // TodoMVCに移動
  await page.goto('https://demo.playwright.dev/todomvc');
  
  // テキストフィールドを探してTODOを追加
  await page.getByPlaceholder('What needs to be done?').fill('テストタスク1');
  await page.keyboard.press('Enter');
  
  // もう1つTODOを追加
  await page.getByPlaceholder('What needs to be done?').fill('テストタスク2');
  await page.keyboard.press('Enter');
  
  // 最初のTODOを完了としてマーク
  await page.locator('.todo-list li').first().getByRole('checkbox').check();
  
  // 完了済みのTODOが1つあることを確認
  await page.locator('.todo-list li.completed').assertCount(1);
}); 