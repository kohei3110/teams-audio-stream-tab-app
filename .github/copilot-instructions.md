# ルール

コード生成に関するルールは、[../docs/rules/](../docs/rules/)、[../docs/specs]フォルダ配下に記載されています。必要に応じて参照してください。

なお、本プロジェクトはテスト駆動開発を採用しており、必ず[../docs/rules/tdd.md](../docs/rules/tdd.md): テスト駆動開発（TDD）ガイドラインを読んで、単体テストを作成してから、本実装に入ってください。

以下は、それぞれのファイルの説明です。

- [../docs/rules/code-style.md](../docs/rules/code-style.md): コーディング規約
- [../docs/rules/directory.md](../docs/rules/directory.md): プロジェクトのディレクトリ構成
- [../docs/rules/tdd.md](../docs/rules/tdd.md): テスト駆動開発（TDD）ガイドライン
- [../docs/rules/project-brief.md](../docs/specs/project-brief.md): プロダクトの目的やユーザーに提供する価値（なぜこのプロジェクトが存在し、何を解決するか）

## ルールの概要

### 1. UIはレスポンシブなデザインにしておく；
Teamsのサイドパネルで表示／実行することになるので、スマホより表示幅が狭くなります。横スクロールが表示されるとストア公開等の際にNGになるので注意が必要です。
 
### 2. タブやウィンドウを新規に開くjavascriptはNG
Teams内で実行するwebアプリでは、open.newTab()やopen.newWindow()は実装できないです。ポップアップモーダルを実装される際は、「タスクモジュール」という機能を利用ください。

### 3. Teams toolkitをご利用ください。
Teams内でwebアプリを実行するために必要となるおまじないがいくつかあります。Teams toolkitにて開発ください。