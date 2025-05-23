# Teams Audio Stream タブアプリケーション

Microsoft Teams会議の音声をリアルタイムでキャプチャし、WebSocketを通じてバックエンドサーバーに送信するMicrosoft Teamsタブアプリケーションです。

## 概要

このプロジェクトは、Microsoft Teams会議に参加中のユーザーの音声をブラウザの`getUserMedia()`APIを用いて取得し、WebSocket経由でバックエンドにリアルタイム送信・保存・処理することを目的としています。システム設計には、各機能を独立して開発・テスト・デプロイ可能なバーティカルスライスアーキテクチャを採用しています。

## 主要機能

- **音声ストリーム取得**: getUserMedia() APIを使用してブラウザから音声を取得
- **リアルタイムストリーミング**: WebSocketを使用して音声データをバックエンドにリアルタイム送信
- **録音制御**: 録音の開始・停止機能
- **ステータス表示**: 接続状態や録音状態のリアルタイム表示
- **エラーハンドリング**: 様々なエラーシナリオに対する適切なフィードバック

## 技術スタック

### フロントエンド
- **言語・フレームワーク**: TypeScript, React
- **UI**: Fluent UI React コンポーネント
- **APIs**: getUserMedia() WebSocket
- **開発ツール**: Teams Toolkit, Jest（テスト）

### バックエンド
- **言語・フレームワーク**: Node.js, Express
- **プロトコル**: WebSocket (ws)
- **ストレージ**: ローカルファイルシステム

## プロジェクト構造

```
frontend/                  # React フロントエンドアプリケーション
  ├── src/                 # ソースコード
  │   ├── components/      # Reactコンポーネント
  │   ├── services/        # サービスクラス
  │   └── __tests__/       # テストファイル
  ├── public/              # 静的ファイル
  ├── api/                 # Azure Functions API
  └── appPackage/          # Teams アプリパッケージ

backend/                   # Node.js バックエンドサーバー
  ├── src/                 # ソースコード
  ├── tests/               # テストファイル
  └── audio-data/          # 録音ファイル保存先
```

## 要件と非機能要件

### 機能要件
- Teams会議参加中のユーザー音声をgetUserMedia()で取得
- 音声ストリームをWebSocketでバックエンドに送信
- ストリームの開始・停止制御
- 送信状況の進捗表示

### 非機能要件
- **パフォーマンス**: 音声ストリーム遅延1秒以内、同時10ユーザーのストリームをサポート
- **セキュリティ**: TLS 1.3暗号化、OAuth 2.0認証
- **可用性**: 稼働率99.5%以上
- **拡張性**: 新規音声分析アルゴリズム導入の容易さ、ユーザー数増加対応
- **信頼性**: データ整合性保証、エラー時のフォールバック処理

## 開発環境セットアップ

### 前提条件
- Node.js (16.x または 18.x)
- Microsoft 365開発者アカウント
- [Teams Toolkit](https://aka.ms/teams-toolkit) 5.0.0以上 (VS Code拡張機能またはCLI)

### インストール手順

1. リポジトリをクローン:
```
git clone https://github.com/yourusername/teams-audio-stream-tab-app.git
cd teams-audio-stream-tab-app
```

2. 依存パッケージのインストール:
```
# フロントエンド
cd frontend
npm install

# バックエンド
cd ../backend
npm install
```

3. バックエンドサーバーの起動:
```
cd backend
npm start
```

4. Teams Toolkitを使用してフロントエンドを起動:
```
cd frontend
npm start
```
または、VS Codeで `F5` キーを押して実行（Teams Toolkit拡張機能が必要）

## テスト

このプロジェクトでは、テスト駆動開発（TDD）を採用しています。

```
# ユニットテストの実行
npm test

# カバレッジレポート付きテスト
npm test -- --coverage
```

## 開発ガイドライン

- コーディング規約: [docs/rules/code-style.md](docs/rules/code-style.md)
- プロジェクト構成: [docs/rules/directory.md](docs/rules/directory.md)
- TDDガイドライン: [docs/rules/tdd.md](docs/rules/tdd.md)

## ライセンス

[MIT](LICENSE)

## 注意事項

1. Teamsの制約として、タブやウィンドウを新規に開くJavaScriptは使用できません。ポップアップモーダルが必要な場合は、Teamsの「タスクモジュール」機能を使用してください。

2. UIはレスポンシブなデザインにしてください。Teamsのサイドパネルでの表示を考慮し、横スクロールが発生しないようにしてください。

3. 音声データの保存と取り扱いには、プライバシーに関する適切な配慮が必要です。
