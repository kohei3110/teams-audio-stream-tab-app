# 組織内での Teams ミーティングアプリの公開手順

このドキュメントでは、Audio Stream Meeting アプリを組織内に公開するための手順を説明します。

## 前提条件

- [Node.js](https://nodejs.org/) (バージョン 16 または 18)
- [Teams Toolkit](https://aka.ms/teams-toolkit) VS Code 拡張機能 (バージョン 5.0.0 以上) または [TeamsFx CLI](https://aka.ms/teamsfx-cli)
- Microsoft 365 開発者アカウント (お持ちでない場合は、[Microsoft 365 開発者プログラム](https://developer.microsoft.com/en-us/microsoft-365/dev-program) から入手できます)
- 組織内アプリをアップロードするための管理者権限

## 公開手順

### 1. アプリのプロビジョニングとデプロイ

アプリを公開する前に、Azure リソースをプロビジョニングしてコードをデプロイする必要があります。

**VS Code から:**
1. コマンドパレットを開き (Ctrl+Shift+P または Cmd+Shift+P)、「Teams: Provision」を選択します
2. プロビジョニングが完了したら、「Teams: Deploy」を選択します

**TeamsFx CLI から:**
```bash
teamsfx provision
teamsfx deploy
```

### 2. アプリパッケージの検証

**VS Code から:**
1. コマンドパレットを開き、「Teams: Validate manifest file」を選択します

**TeamsFx CLI から:**
```bash
teamsfx validate
```

### 3. アプリパッケージの作成

**VS Code から:**
1. コマンドパレットを開き、「Teams: Zip Teams metadata package」を選択します

**TeamsFx CLI から:**
```bash
teamsfx package
```

### 4. 組織内へのアプリの公開

**VS Code から:**
1. コマンドパレットを開き、「Teams: Publish to Teams」を選択します
2. 公開プロセスが完了するまで待ちます

**TeamsFx CLI から:**
```bash
teamsfx publish
```

公開が完了すると、アプリは Teams 管理センターに送信され、管理者の承認待ちになります。

### 5. 管理者による承認（管理者向け）

1. [Teams 管理センター](https://admin.teams.microsoft.com) にアクセスします
2. 左側のナビゲーションで「Teams アプリ」→「アプリの管理」に移動します
3. 「公開待ち」セクションでアプリを見つけ、選択します
4. アプリの詳細を確認し、「公開」ボタンをクリックして組織内に公開します

### 6. 会議での利用方法

アプリが承認されると、以下の方法で会議内で利用できるようになります：

1. Teams 会議を開始または参加します
2. 会議上部の「アプリ」ボタンをクリックします
3. アプリ一覧から「Audio Stream Meeting App」を選択します
4. サイドパネルがひらき、アプリを利用できます

## トラブルシューティング

- **アプリが公開待ちリストに表示されない**: 管理者に連絡して、公開待ちアプリの確認を依頼してください
- **アプリが会議で利用できない**: アプリの manifest.json に会議コンテキスト (`meetingSidePanel`, `meetingStage`) が正しく設定されているか確認してください
- **アクセス権限エラー**: AAD アプリに必要な権限（OnlineMeetings.Read, OnlineMeetings.ReadWrite）が付与されているか確認してください

## 参考リンク

- [Teams 会議アプリの開発](https://learn.microsoft.com/ja-jp/microsoftteams/platform/apps-in-teams-meetings/teams-apps-in-meetings)
- [Teams アプリの公開](https://learn.microsoft.com/ja-jp/microsoftteams/platform/concepts/deploy-and-publish/appsource/publish)
- [Teams Toolkit ドキュメント](https://learn.microsoft.com/ja-jp/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)