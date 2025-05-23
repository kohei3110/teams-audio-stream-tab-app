# テスト駆動開発 (TDD) ガイドライン

## 1. TDDの基本サイクル

React/Node.js アプリケーション開発プロジェクトでは、以下のTDDサイクルを採用します：

### Red-Green-Refactor サイクル

1. **Red**: 失敗するテストを書く
- 実装したい機能を明確にする
- テストは実装前に記述し、必ず失敗することを確認する
- テストは機能要件を明確に表現したものであること

2. **Green**: 最小限のコードで成功させる
- テストが通るための最小限（必要十分）のコードを実装する
- この段階ではパフォーマンスやエレガントさより機能の正しさを優先する

3. **Refactor**: リファクタリングする
- コードの品質を高めるための改善を行う
- テストは引き続き成功する状態を維持する
- コードの重複を排除し、可読性を向上させる

## 2. テストの種類と役割

### 2.1 ユニットテスト

- 対象: 関数、メソッド、小さなコンポーネント
- 目的: コードの最小単位の正確性を検証
- 特徴: 高速に実行可能、外部依存をモック化
- ツール: Jest, @testing-library/react
- 場所: 各機能モジュール内の `__tests__` ディレクトリや `*.test.(js|ts|jsx|tsx)` ファイル

```javascript
// 例: Reactコンポーネントのユニットテスト
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from '../AudioPlayer';

test('mp3ファイルを再生できる', () => {
  render(<AudioPlayer src="test.mp3" />);
  const playButton = screen.getByRole('button', { name: /play/i });
  userEvent.click(playButton);
  expect(screen.getByTestId('audio-element').src).toMatch(/test.mp3/);
});
```

### 2.2 統合テスト

- 対象: 複数のコンポーネントやAPIの相互作用
- 目的: コンポーネント間やAPI連携が正しく機能することを確認
- 特徴: やや実行に時間がかかる、一部の外部依存を実際に使用
- 場所: `__tests__/integration` ディレクトリ

```javascript
// 例: Node.js APIの統合テスト
import request from 'supertest';
import app from '../../src/app';

test('ファイルアップロードと変換フロー', async () => {
  const uploadRes = await request(app)
    .post('/api/files/upload')
    .attach('file', Buffer.from('dummy'), 'test.mp4');
  expect(uploadRes.status).toBe(200);
  const { fileId } = uploadRes.body;

  const convertRes = await request(app)
    .post(`/api/files/${fileId}/convert`)
    .send({ format: 'mp3' });
  expect(convertRes.body.status).toBe('completed');
});
```

### 2.3 エンドツーエンド (E2E) テスト

- 対象: システム全体の機能
- 目的: ユーザーの視点からのシナリオ検証
- 特徴: 実行に時間がかかる、実際のサービスやUIと連携
- ツール: Playwright, Cypress
- 場所: `e2e/` ディレクトリ

```javascript
// 例: PlaywrightによるE2Eテスト
import { test, expect } from '@playwright/test';

test('音声ファイルアップロードから通知まで', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'test_samples/conversation.mp4');
  await page.click('button:has-text("アップロード")');
  await expect(page.locator('text=変換完了')).toBeVisible({ timeout: 120000 });
});
```

## 3. テストカバレッジ方針

- **目標カバレッジ**: コードベース全体で80%以上
- **重要コンポーネント**: 核となるビジネスロジックは90%以上
- **測定**: Jestのカバレッジ機能を使用
- **レポート**: CI/CDパイプラインで自動生成

## 4. モックとスタブの使用ガイドライン

### 4.1 モックを使用するケース

- 外部サービス（Azure, 外部API等）の呼び出し
- データベース操作
- ファイルシステムアクセス
- 時間依存の処理

### 4.2 モック実装例

```javascript
// Azureサービスや外部APIをjest.mockでモック化する例
jest.mock('../azure/speechService', () => ({
  transcribe: jest.fn(() => Promise.resolve({
    text: 'こんにちは、具合はどうですか？',
    speaker: 'veterinarian',
    confidence: 0.95
  }))
}));
```

### 4.3 テストダブル選択指針

- **Stub**: 単純な戻り値が必要な場合
- **Mock**: 呼び出し回数や引数の検証が必要な場合
- **Fake**: 軽量な代替実装が必要な場合（インメモリDBなど）
- **Spy**: 実際の処理を行いつつ呼び出し情報も記録する場合

## 5. テストデータ管理

- テストデータは `__fixtures__` ディレクトリに格納
- 大容量ファイルはGitに含めず、CIパイプラインで取得
- 機密データはテスト用に匿名化したものを使用
- フィクスチャやファクトリ関数を活用

```javascript
// 例: テスト用データファクトリ
export function createSampleConversation() {
  return {
    metadata: {
      farmId: 'farm_123',
      date: '2023-05-15',
      duration: 630 // 10分30秒
    },
    transcript: [
      { time: 0, speaker: 'veterinarian', text: '今日はどのような症状がありますか？' },
      { time: 5, speaker: 'farmer', text: '牛の食欲が昨日から落ちているんです' }
      // ...
    ]
  };
}
```

## 6. テスト自動化

### 6.1 ローカル開発環境

- コミット前に自動実行するプリコミットフック（lint-staged, husky等）
- 変更されたコードに関連するテストのみ実行する機能（Jestの--findRelatedTests等）

### 6.2 CI/CD パイプライン

- プルリクエスト時に全テストを自動実行
- テストカバレッジレポートの自動生成
- 失敗テストの通知とレポート

### 6.3 実行コマンド

```bash
# ユニットテストのみ実行
npx jest

# 統合テストを実行
npx jest __tests__/integration

# E2Eテストを実行（Playwright例）
npx playwright test

# カバレッジレポート付きで全テスト実行
npx jest --coverage
```

## 7. TDDのベストプラクティス

### 7.1 テストファーストの原則

- 必ず実装前にテストを記述する
- テストが意味のある失敗を示すことを確認してから実装に進む

### 7.2 FIRST原則

- **Fast**: テストは高速に実行できること
- **Independent**: テスト間に依存関係がないこと
- **Repeatable**: 何度実行しても同じ結果が得られること
- **Self-validating**: テストは自己検証可能であること
- **Timely**: テストは実装前に書くこと

### 7.3 テストの表現力

- テスト名は検証内容を明確に表現する
- Given-When-Then パターンで条件、操作、期待結果を明確に
- ヘルパー関数を使って複雑なセットアップを抽象化

```javascript
// 例: Node.jsサービスの分岐テスト
import { processFile } from '../fileService';

test('大容量ファイルはチャンク処理される', () => {
  // Given
  const largeFile = { size: 500 * 1024 * 1024 };
  // When
  const result = processFile(largeFile);
  // Then
  expect(result.processingStrategy).toBe('chunked');
  expect(result.chunks.length).toBeGreaterThan(1);
});
```

## 8. 特定のテスト戦略

### 8.1 非同期コードのテスト

```javascript
// async/awaitを使った非同期テスト
import { asyncProcessFile } from '../asyncFileService';

test('非同期ファイル処理が完了する', async () => {
  const result = await asyncProcessFile('test.mp4');
  expect(result.status).toBe('completed');
});
```

### 8.2 例外とエラー処理のテスト

```javascript
test('不正なファイル形式は例外を投げる', () => {
  const { convert } = require('../audioConverter');
  expect(() => convert('test.txt', 'mp3')).toThrow(/Unsupported format/);
});
```

### 8.3 分岐条件のテスト

各条件分岐を網羅するテストを作成し、すべてのパスが少なくとも1回は実行されるようにする。

## 9. コードレビューとテスト

コードレビューでは以下の点を重点的に確認します：

1. テストが機能要件を適切にカバーしているか
2. テスト自体の品質は適切か
3. エッジケースや例外パターンがテストされているか
4. テストの可読性と保守性は確保されているか

## 10. 継続的改善

- テスト戦略を定期的に見直し、改善する
- 重要な障害発生時には、該当するケースのテストを追加
- チーム内でテスト技術の共有と学習を促進