# Playwright MCPプラットフォーム

Playwright MCPを活用したE2Eテスト実行プラットフォームです。

## 特徴

- JSON形式でテスト定義を記述
- CLIからテスト実行が可能
- Playwrightのすべての機能を活用
- MCPによるAI支援テスト
- テスト完了後の自動クリーンアップ機能
- テストレポート表示の柔軟な制御

## インストール

```bash
npm install
```

## 使用方法

### 基本的な実行方法

```bash
npm run run-example
```

### サンプルテスト定義の生成

```bash
npm run example
```

### 特定のブラウザでテスト実行

```bash
npm run start -- run tests/examples/login-test.json --browser=firefox
```

### ヘッドレスモードでテスト実行

```bash
npm run start -- run tests/examples/login-test.json --headless
```

### テストファイルを保持する

デフォルトでは、テスト完了後に生成されたspec.jsファイルは自動的に削除されます。
ファイルを保持したい場合は、以下のオプションを使用します：

```bash
npm run start -- run tests/examples/login-test.json --keep-files
```

### テスト失敗時のレポート表示を制御する

デフォルトでは、テスト失敗時にPlaywrightのテストレポートが自動的に表示されます。
レポートを表示したくない場合は、以下のオプションを使用します：

```bash
npm run start -- run tests/examples/login-test.json --no-report
```

## テスト定義の書き方

テスト定義はJSON形式で記述します。例：

```json
{
  "name": "ログインテスト",
  "steps": [
    { "action": "navigate", "url": "https://example.com/login" },
    { "action": "type", "element": "ユーザー名フィールド", "text": "testuser" },
    { "action": "type", "element": "パスワードフィールド", "text": "password", "submit": true },
    { "action": "assertion", "expect": "ダッシュボード画面が表示される" }
  ]
}
```

## サポートされているアクション

- `navigate` - ウェブページに移動
- `click` - 要素をクリック
- `type` - テキストを入力
- `wait` - 一定時間または特定の条件が満たされるまで待機
- `assertion` - 特定の条件が真であることを検証

## コマンドラインオプション一覧

| オプション | 説明 |
|------------|------|
| `--browser <browser>` | ブラウザを指定（chromium, firefox, webkit） |
| `--headed` | ヘッド付きモードで実行（UIあり） |
| `--headless` | ヘッドレスモードで実行 |
| `--timeout <ms>` | テストのタイムアウト時間（ミリ秒） |
| `--model <model>` | MCPで使用するAIモデル |
| `--keep-files` | テスト完了後もspec.jsファイルを保持する |
| `--no-report` | テスト失敗時にレポートを自動表示しない |

## ライセンス

MIT 