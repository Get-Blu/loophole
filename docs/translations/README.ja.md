<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
コードを書きながら考えるオープンソースのAIコードエディタ。
</p>

<div align="center">

<img src="https://img.shields.io/github/license/loophole-ai/loophole-ide?style=for-the-badge" alt="License" />
<img src="https://img.shields.io/github/stars/loophole-ai/loophole-ide?style=for-the-badge" alt="Stars" />
<img src="https://img.shields.io/github/issues/loophole-ai/loophole-ide?style=for-the-badge" alt="Issues" />

</div>

<div align="center">

<table>
<tbody>
<td align="center"><a href="https://www.loopholeeditor.in"><strong>Loophole</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide"><strong>GitHub</strong></a></td>
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>ドキュメント</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>貢献する</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>問題</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>ディスカッション</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loopholeは、Void Editorから派生した完全なオープンソースのAIネイティブコードエディタです（Void EditorはVS Codeから派生しています）。エディタの最も深いレベルにAI機能を統合しており、プラグインではなく、編集エクスペリエンスの基本的な部分です。すべてのコードはあなたのマシンに留まります。

AI要求は**あなたのマシンから直接、選択したプロバイダに送信されます**。あなたのコードはLoopholeサーバーを通過しません。自分のAPIキーを持参するか、ローカルモデルを実行し、Loopholeが残りを処理します。

完全なエージェントエンジン、インラインオートコンプリート、4モードのAIチャットサイドバー、クイック編集、AI生成のGitコミットメッセージ、音声入力、トークン使用量とコスト追跡、MCPサーバーサポート、およびClaudeとOpenAI o1/o3-miniの推論モデルサポートが付属しています。

## Loopholeを選ぶ理由

- **ポリシーではなく、アーキテクチャによるプライバシー。** すべてのAI要求は、あなたのマシンからプロバイダの公開APIを介してプロバイダに直接送信されます。Loopholeバックエンドはなく、プロンプトログもなく、仲介者もいません。
- **4種類の作業のための4つのチャットモード。** 通常モードは質問に会話的に答えます。収集モードにより、AIはファイルに触れることなくコードベースを読み取り、検索できます。計画モードにより、AIは編集を実行する前に、マルチステップの計画を見えるようにします。適用モードは、プレーンテキストの説明を1つのステップでgit準備完了のコードに変換します。
- **真のエージェントツール表面。** エージェントはページネーション付きでファイルを読み取り、外科的なSEARCH/REPLACE編集を実行し、ファイル全体を書き直し、ファイルとフォルダを作成・削除し、パスを名前変更・移動し、シェルコマンドを実行し、MCPツールを呼び出すことができます。
- **並列サブエージェント。** エージェントは`general`（完全なツール）または`researcher`（読み取り専用）サブエージェントを生成して、独立したサブタスクを同時に処理できます。サブエージェントは、編集を続ける間、バックグラウンドで実行できます。
- **速度のために構築されたオートコンプリート。** インラインコンプリーションエンジンはFill-In-the-Middleアプローチを使用し、カーソルの前後のコードを送信して、モデルが間に正確に何が属しているかを予測します。トークンの浪費なし、遅延なし。
- **機能ごとのモデル割り当て。** チャット、クイック編集（Ctrl+K）、オートコンプリート、適用、Gitコミットメッセージ生成はそれぞれ独自のモデルスロットを持ちます。チャットには強力な推論モデルを使用し、オートコンプリートには高速モデルを使用します。
- **20以上のプロバイダ、完全にローカルなものを含む。** Anthropic、OpenAI、Google Gemini、DeepSeek、xAI、Mistral、Groq、Cohere、Perplexity、OpenRouter、Together AI、Fireworks AI、Inception Labs、LiteLLM、Vertex AI、Azure OpenAI、AWS Bedrock、Ollama、vLLM、LM Studio、およびOpenAI互換エンドポイント。
- **推論モデルサポート。** モデルが拡張思考をサポートする場合、Loopholeは正しく構成します：Anthropicスタイル推論の予算スライダー、OpenAIスタイルの努力スライダー、思考と結果の両方を見ることができるコラボレーティブUIです。
- **MCPサーバーサポート。** 外部Model Context Protocolサーバーを接続して、カスタムツールでエージェントを拡張します。MCPツールはエージェントモードの組み込みツールと共に表示され、同じ承認ゲートを通過します。
- **トークン使用量とコスト追跡。** 各応答は入力トークン、出力トークン、およびプロバイダごとの価格に基づいた推定USD費用を記録します。トークン使用ダイアログは累積日次合計とプロバイダごとの内訳を表示します。
- **AIコミットメッセージ。** Git SCMパネルにはAIボタンがあり、ステージングされたdiffを設定されたSCMモデルに送信し、コミットメッセージをGit入力ボックスに直接ストリーミングします。これはGitに接続されているため、Loopholeから修正と押し出しを行うことができます。
- **音声入力。** マイクを使用してチャットにメッセージをしゃべることができます。Loopholeはオーディオを取得してプロバイダを介して文字起こしし、チャット入力に結果を入力します。
- **承認制御。** ファイル編集、ターミナルコマンド、MCPツール呼び出しはそれぞれ独自の承認カテゴリを持ちます。カテゴリごとに手動確認を要求するか、信頼できる操作に対してグローバルに自動承認を有効にすることができます。

## サポートされているプロバイダ

| プロバイダ | 注記 |
|----------|-------|
| Anthropic | Claudeモデル、ストリーミング、推論サポート |
| OpenAI | GPTおよびoシリーズモデル |
| Google Gemini | Gemini FlashおよびPro、ネイティブGeminiメッセージ形式 |
| DeepSeek | DeepSeek V4 ProおよびFlash |
| xAI | 推論バリアントを含むGrokモデル |
| Mistral | Mistral Large、Magistral、Codestral、Devstral |
| Groq | 超高速推論 |
| Cohere | 推論を含むCommandモデル |
| Perplexity | Webサーチ付きSonarモデル |
| OpenRouter | 単一のAPIキーで200以上のモデル |
| Together AI | オープンソースモデルホスティング |
| Fireworks AI | 高速オープンソース推論 |
| Inception Labs | Mercury拡散モデル、オートコンプリート用FIM最適化 |
| LiteLLM | OpenAI互換プロキシレイヤー |
| Google Vertex AI | OpenAI互換エンドポイント経由のエンタープライズGoogle AI |
| Microsoft Azure | Azure AI FoundryおよびAzure OpenAI |
| AWS Bedrock | Amazon管理のAIモデル |
| Ollama | ローカルモデルランナー、自動検出 |
| vLLM | ローカル高性能推論、自動検出 |
| LM Studio | ローカルGUIモデルランナー、自動検出 |
| OpenAI互換 | OpenAI互換APIを備えたカスタムエンドポイント |

## ソースからのビルド

要件：Node.js 22以上、Python、C++ビルドツール。

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# 1つのターミナルで
npm run watch

# 別のターミナルで
npm run electron
```

## プロジェクト構造

AI固有のコードはすべて`src/vs/workbench/contrib/void/`の下にあります。`browser/`レイヤーには、オートコンプリートエンジン、コンテキスト収集サービス、SCM統合、サイドバーおよびクイック編集ペイン、チャットUIが含まれます。`common/`レイヤーは共有型と定数を定義します。`electron/`レイヤーはElectron統合とシステム統合を処理します。

`extensions/`ディレクトリにはすべての標準VS Code組み込み拡張機能と`theme-loophole`（Loopholeのカスタムダークテーマ）が含まれます。`cli/`ディレクトリにはRustベースのCLIツールが含まれます。ビルドスクリプトとパッケージング構成はルートにあります。

## AI要求はどのように流れるか

ユーザーアクション（チャットメッセージの送信、Ctrl+Kの押下、またはエディタへの入力）は関連サービスをトリガーします。そのサービスは`contextGatheringService`を呼び出して、開いているファイル、現在の選択、git履歴、およびアクティブなターミナルからコンテキストを組み立てます。組み立てられたコンテキストがエージェントに送信され、マルチターンエージェントループを実行します。エージェントアクション（編集、ファイル作成、シェルコマンド、MCPツール呼び出し）はエディタに戻されて実行または承認されます。

## 貢献

コミュニティからの貢献を歓迎します。プルリクエストを送信する前に、[貢献ガイド](../../HOW_TO_CONTRIBUTE.md)をお読みください。コードベースの詳細な技術概要については、[コードベースガイド](../../LOOPHOLE_CODEBASE_GUIDE.md)をご覧ください。

## ライセンス

Loopholeは[GNU Affero General Public License v3.0](../../LICENSE.txt)（AGPL-3.0）の下でライセンスされています。[Void Editor](https://github.com/voideditor/void)（Apache 2.0）および[VS Code](https://github.com/microsoft/vscode)（MIT）のコードが組み込まれています。
