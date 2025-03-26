# Playwright MCPプラットフォーム

Playwright MCPを活用したE2Eテスト実行プラットフォームです。

## 特徴

- JSON形式でテスト定義を記述
- CLIからテスト実行が可能
- Playwrightのすべての機能を活用
- MCPによるAI支援テスト
- ネイティブアクションへの自動フォールバック機能
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

### MCPを使用したAI支援テストの実行

Playwright MCPを活用した自然言語指示によるテスト実行が可能です。MCPが利用できない環境でも、自動的にネイティブなPlaywright操作にフォールバックします。

```bash
npm run mcp-test
# または
npm run start -- mcp tests/my-test.json
```

#### MCPテスト実行時のオプション

| オプション | 説明 |
|------------|------|
| `--model <model>` | MCPで使用するAIモデル（gpt-4o, gpt-4-turbo, gpt-3.5-turbo, claude-3-opus, claude-3-sonnet）|
| `--vision` | ビジョンモードを使用（スクリーンショットベース）|
| `--headed` | ブラウザのUIを表示（デフォルト：有効）|
| `--headless` | ブラウザのUIを非表示|

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

## MCP自然言語コマンド

MCPでは以下のような自然言語コマンドをサポートしています：

- `要素 "セレクタ" をクリックする`
- `要素 "セレクタ" に "テキスト" と入力する`
- `要素 "セレクタ" に "テキスト" と入力する、そしてEnterキーを押す`
- `要素 "セレクタ" が表示されるまで待機する`
- `要素 "セレクタ" が 3 個存在することを確認する`
- `要素 "セレクタ" のテキストが "期待値" であることを確認する`

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

## ネイティブアクションへのフォールバック機能

本プラットフォームでは、Playwright MCPが利用できない環境でも自動的にネイティブなPlaywright操作にフォールバックする機能を備えています。これにより、MCPサーバーの設定や接続に問題がある場合でも、テストを安定して実行できます。

フォールバック機能は自然言語コマンドを解析し、同等のPlaywright APIに変換して実行します。これにより、同じテスト定義ファイルをMCPの有無に関わらず使用できます。

## Playwright MCPについて

Playwright MCPは、Microsoft社が提供するモデルコンテキストプロトコル（MCP）を使用したE2Eテストフレームワークです。LLMがウェブページの構造を把握し、自然言語でテストを実行できるようになります。主な特徴：

- **スナップショットモード**：アクセシビリティツリーを使用し、スクリーンショットなしでページの構造を把握
- **ビジョンモード**：スクリーンショットを使用し、視覚的な要素を認識して操作
- **自然言語での指示**：「ログインボタンをクリックする」といった自然な指示でブラウザを操作

詳細は[Playwright MCP公式リポジトリ](https://github.com/microsoft/playwright-mcp)をご参照ください。

## ライセンス

MIT 

## 開発者向け情報

### コード品質管理

プロジェクトでは以下のツールを使用してコード品質を管理しています：

- ESLint: TypeScriptのコード品質チェック
- Prettier: コードフォーマット

#### 利用可能なコマンド

```bash
# コードの品質チェック
npm run lint

# 自動修正可能な問題を修正
npm run lint:fix

# コードのフォーマット
npm run format
```

### コーディング規約

- 関数の戻り値の型は明示的に指定することを推奨
- `any`型の使用は最小限に抑える
- 未使用の変数は`_`プレフィックスを付ける
- コードは自動フォーマットツール（Prettier）で整形する 