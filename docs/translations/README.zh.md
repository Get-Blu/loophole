<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
开源的AI代码编辑器，在您编码时思考。
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>文档</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>贡献</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>问题</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>讨论</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole 是一个完全开源的AI原生代码编辑器，从Void Editor分叉而来（Void Editor本身是VS Code的分叉）。它在编辑器的最深层集成了AI功能——不是作为插件，而是作为编辑体验的基本部分。所有代码都保留在您的机器上。

AI请求**直接从您的机器发送到您选择的提供商**。您的代码永远不会通过Loophole服务器。您可以使用自己的API密钥或运行本地模型，Loophole负责处理其余部分。

它配备了完整的代理引擎、内联自动完成、四模式AI聊天侧栏、快速编辑、AI生成的Git提交消息、语音输入、令牌使用和成本跟踪、MCP服务器支持，以及对Claude和OpenAI o1/o3-mini的推理模型支持。

## 为什么选择Loophole

- **隐私由架构而非政策保证。** 每个AI请求都通过公共API直接从您的机器发送到提供商。没有Loophole后端、没有提示日志、没有中介。
- **四种聊天模式用于四种工作。** 正常模式以对话方式回答问题。收集模式让AI读取和搜索您的代码库而不触及任何文件。计划模式让AI在执行编辑之前向您制定多步骤计划。应用模式将纯文本描述一次性转换为git就绪代码。
- **真实的代理工具表面。** 代理可以读取带有分页的文件、进行手术式的SEARCH/REPLACE编辑、重写整个文件、创建和删除文件和文件夹、重命名和移动路径、运行shell命令，以及调用MCP工具。
- **并行子代理。** 代理可以生成`general`（完整工具）或`researcher`（只读）子代理来并发处理独立的子任务。子代理可以在后台运行，而您继续编辑。
- **为速度而设计的自动完成。** 内联完成引擎使用Fill-In-the-Middle方法，发送光标前后的代码以便模型准确预测中间应该是什么。没有令牌浪费，没有延迟。
- **每个功能的模型分配。** 聊天、快速编辑（Ctrl+K）、自动完成、应用和Git提交消息生成各有自己的模型插槽。为聊天使用强大的推理模型，为自动完成使用快速模型。
- **20+个提供商，包括完全本地的。** Anthropic、OpenAI、Google Gemini、DeepSeek、xAI、Mistral、Groq、Cohere、Perplexity、OpenRouter、Together AI、Fireworks AI、Inception Labs、LiteLLM、Vertex AI、Azure OpenAI、AWS Bedrock、Ollama、vLLM、LM Studio和OpenAI兼容端点。
- **推理模型支持。** 当模型支持扩展思考时，Loophole正确配置它：Anthropic风格推理的预算滑块、OpenAI风格的工作量滑块，以及协作UI以便您同时看到思考和结果。
- **MCP服务器支持。** 连接外部Model Context Protocol服务器以扩展代理的自定义工具。MCP工具与Agent模式中的内置工具一起出现，并通过相同的批准门。
- **令牌使用和成本跟踪。** 每个响应都记录输入令牌、输出令牌和基于每个提供商定价的估计美元成本。令牌使用对话框显示累积的每日总计和每个提供商的细目。
- **AI提交消息。** Git SCM面板有一个AI按钮，将您的分阶段差异发送到配置的SCM模型，并将提交消息直接流式传输到Git输入框。这连接到Git，所以您可以从Loophole修改和推送。
- **语音输入。** 您可以使用麦克风向聊天口述消息。Loophole捕获PCM音频，通过提供商转录，并使用结果填充聊天输入。
- **批准控制。** 文件编辑、终端命令和MCP工具调用各有自己的批准类别。您可以要求每个类别的手动确认或全局启用自动批准以用于受信任的操作。

## 支持的提供商

| 提供商 | 说明 |
|----------|-------|
| Anthropic | Claude模型、流式传输、推理支持 |
| OpenAI | GPT和o系列模型 |
| Google Gemini | Gemini Flash和Pro、原生Gemini消息格式 |
| DeepSeek | DeepSeek V4 Pro和Flash |
| xAI | Grok模型包括推理变体 |
| Mistral | Mistral Large、Magistral、Codestral、Devstral |
| Groq | 超快速推理 |
| Cohere | Command模型包括推理 |
| Perplexity | Sonar模型带网络搜索 |
| OpenRouter | 通过单个API密钥的200+模型 |
| Together AI | 开源模型托管 |
| Fireworks AI | 快速开源推理 |
| Inception Labs | Mercury扩散模型，为自动完成优化的FIM |
| LiteLLM | OpenAI兼容代理层 |
| Google Vertex AI | 通过OpenAI兼容端点的企业Google AI |
| Microsoft Azure | Azure AI Foundry和Azure OpenAI |
| AWS Bedrock | Amazon管理的AI模型 |
| Ollama | 本地模型运行器，自动检测 |
| vLLM | 本地高性能推理，自动检测 |
| LM Studio | 本地GUI模型运行器，自动检测 |
| OpenAI兼容 | 任何具有OpenAI兼容API的自定义端点 |

## 从源代码构建

要求：Node.js 22或更高版本、Python和C++构建工具。

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# 在一个终端中
npm run watch

# 在另一个终端中
npm run electron
```

## 项目结构

所有AI特定代码都位于`src/vs/workbench/contrib/void/`下。`browser/`层包含自动完成引擎、上下文收集服务、SCM集成、侧栏和快速编辑窗格以及聊天UI。`common/`层定义共享类型和常量。`electron/`层处理Electron集成和系统集成。

`extensions/`目录包含所有标准VS Code内置扩展加上`theme-loophole`（Loophole的自定义深色主题）。`cli/`目录包含基于Rust的CLI工具。构建脚本和打包配置在根目录中。

## AI请求如何流动

用户操作——发送聊天消息、按Ctrl+K或在编辑器中键入——触发相关服务。该服务调用`contextGatheringService`从打开的文件、当前选择、git历史和活动终端组装上下文。组装的上下文被发送到代理，代理执行多轮代理循环。代理操作（编辑、文件创建、shell命令、MCP工具调用）被路由回编辑器以执行或批准。

## 贡献

我们欢迎来自社区的贡献。在提交拉取请求之前，请阅读[贡献指南](../../HOW_TO_CONTRIBUTE.md)。有关代码库的深入技术概述，请参阅[代码库指南](../../LOOPHOLE_CODEBASE_GUIDE.md)。

## 许可证

Loophole许可证遵循[GNU Affero通用公共许可证v3.0](../../LICENSE.txt)（AGPL-3.0）。它包含来自[Void Editor](https://github.com/voideditor/void)（Apache 2.0）和[VS Code](https://github.com/microsoft/vscode)（MIT）的代码。
