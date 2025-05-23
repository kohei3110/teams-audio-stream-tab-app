# コーディング規約

## 1. 一般原則

### 1.1 コードの明瞭性
- シンプルで読みやすいコードを優先する
- 過度な最適化よりも可読性を重視する
- 自己文書化コードを目指し、適切な変数名・関数名を選定する

### 1.2 一貫性
- プロジェクト全体で統一されたスタイルを維持する
- 既存のコードパターンに従う
- 個人の好みよりもチームの規約を優先する

### 1.3 DRY原則 (Don't Repeat Yourself)
- コードの重複を避け、共通処理は抽象化する
- 類似コードは共通の抽象化を検討する
- ただし、過度な抽象化による複雑化も避ける

## 2. JavaScript/TypeScript/React コーディングスタイル

### 2.1 スタイルガイド
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)や[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)を参考にする
- フォーマッタはPrettier、静的解析はESLintを使用
- インデントは2スペース
- 行の長さは最大100文字

### 2.2 命名規則
- クラス名: UpperCamelCase (例: `AudioProcessor`)
- 関数/メソッド名: lowerCamelCase (例: `convertAudioFormat`)
- 変数名: lowerCamelCase (例: `audioFile`)
- 定数名: UPPER_SNAKE_CASE (例: `MAX_FILE_SIZE`)
- Reactコンポーネント: UpperCamelCase (例: `AudioPlayer`)
- プライベート変数/メソッド: 先頭にアンダースコアは使わず、TypeScriptのprivate修飾子を利用

### 2.3 インポート
- import文は以下の順序で記述:
  1. Node.js組み込み
  2. サードパーティ
  3. エイリアス/絶対パス
  4. 相対パス
- 各グループ内はアルファベット順
- ワイルドカードimportは避ける

```typescript
// 正しいインポート例
import fs from 'fs';
import path from 'path';

import express from 'express';
import React from 'react';

import { AudioConverter } from '@/features/audioConversion';
import { formatTimestamp } from '@/shared/utils';

import AudioPlayer from '../components/AudioPlayer';
```

### 2.4 ドキュメンテーション
- すべての公開API、クラス、関数にはJSDocコメントを記述
- 複雑なロジックには適切なインラインコメントを付与

```typescript
/**
 * 音声ファイルを指定されたフォーマットに変換する
 * @param inputFile 入力ファイルのパス
 * @param outputFormat 出力形式 (デフォルト: 'mp3')
 * @returns 変換後のファイルパス
 * @throws {FileNotFoundError} 入力ファイルが存在しない場合
 * @throws {ConversionError} 変換処理に失敗した場合
 */
function convertAudio(inputFile: string, outputFormat = 'mp3'): string {
  // ...実装...
}
```

### 2.5 型注釈
- すべての関数・メソッド・変数にTypeScript型注釈を付与
- 複雑な型は型エイリアスやインターフェースを活用
- 型注釈はドキュメントとしても役立つ

## 3. プロジェクト固有のルール

### 3.1 エラー処理
- 例外は具体的なErrorクラスを使用し、汎用的なErrorは避ける
- カスタムエラーは`src/shared/errors`に定義
- すべての例外は適切にログに記録する

### 3.2 ログ記録
- システムの動作状況を把握できるよう、適切なログレベルを使用
- ログメッセージは情報を明確に伝える内容にする
- 個人情報や機密情報のログ出力は避ける

```typescript
// 正しいログ記録例
console.info(`File processing started: ${fileId}`);
console.error(`Conversion failed for file ${fileId}: ${error}`);
```

### 3.3 テスト
- すべての機能にはユニットテストを書く（Jest, @testing-library/react推奨）
- モックを適切に使用して外部依存を分離する
- 重要なユースケースには統合テストとE2Eテスト（Playwright/Cypress）を用意

### 3.4 非同期処理
- I/O待ち時間が長い処理はasync/awaitを使用
- ブロッキング処理はワーカーやバックグラウンドタスクとして実行
- 適切なタイムアウト処理を実装

## 4. コード品質ツール

以下のツールを用いて継続的にコード品質を確保する:

- **ESLint**: 静的解析
- **Prettier**: コードフォーマッタ
- **TypeScript**: 型チェック
- **Jest**: ユニットテスト
- **Playwright/Cypress**: E2Eテスト
- **Husky/lint-staged**: コミット前フック

## 5. コードレビュー基準

コードレビューでは以下の点に注目する:

- 機能要件の充足
- コーディング規約の遵守
- アーキテクチャ設計原則の遵守
- テストの充実度
- エラー処理の適切さ
- パフォーマンスへの配慮
- セキュリティ上の懸念

## 6. バージョン管理

- コミットメッセージは明確で説明的に記述
- [Conventional Commits](https://www.conventionalcommits.org/) の形式に従う
- 機能単位でブランチを分け、完了後にプルリクエストを作成

```
feat: 音声ファイル変換機能の追加
fix: 大容量ファイル処理時のメモリリーク修正
docs: APIドキュメントの更新
test: 音声認識サービスのテストケース追加
```