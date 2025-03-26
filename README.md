# Playwright MCPプラットフォーム

Playwright MCPを活用したE2Eテスト実行ツールです。

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

### ヘッド付きモード（UI表示あり）でテスト実行

```bash
npm run start -- run tests/examples/login-test.json --headed
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

### 標準的なPlaywrightテストの実行

```bash
npm run start -- pw-test tests/sample-test.js
```

### 利用可能なMCPモデルを表示

```bash
npm run start -- list-models
```

## テスト定義の書き方

テスト定義はJSON形式で記述します。例：

```json
{
  "name": "基本ログインテスト",
  "steps": [
    { "action": "navigate", "url": "https://demo.playwright.dev/todomvc" },
    { "action": "wait", "seconds": 2, "description": "ページが表示されるのを待つ" },
    { "action": "type", "element": "input.new-todo", "text": "テストアイテム1を作成", "submit": true },
    { "action": "assertion", "element": ".todo-list li", "expect": "count", "value": 1 }
  ],
  "config": {
    "browser": "chromium",
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "timeout": 30000
  }
}
```

## サポートされているアクション

- `navigate` - ウェブページに移動
- `click` - 要素をクリック
- `type` - テキストを入力（submit: trueでEnterキーを押下）
- `wait` - 一定時間（seconds指定）または特定の要素（element指定）が表示されるまで待機
- `assertion` - 特定の条件が真であることを検証
  - `expect: "count"` - 要素の数が一致するか検証
  - `expect: "visible"` - 要素が表示されているか検証
  - `expect: "text"` - 要素のテキストが一致するか検証

## コマンドラインオプション一覧

| オプション | 説明 |
|------------|------|
| `--browser <browser>` | ブラウザを指定（chromium, firefox, webkit） |
| `--headed` | ヘッド付きモードで実行（UIあり） |
| `--headless` | ヘッドレスモードで実行 |
| `--timeout <ms>` | テストのタイムアウト時間（ミリ秒） |
| `--model <model>` | MCPで使用するAIモデル（gpt-4o, gpt-4-turbo, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet） |
| `--keep-files` | テスト完了後もspec.jsファイルを保持する |
| `--no-report` | テスト失敗時にレポートを自動表示しない |

## ライセンス

MIT 