<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
코드를 작성하면서 생각하는 오픈소스 AI 코드 편집기.
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>문서</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>기여하기</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>문제</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>토론</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole은 Void Editor에서 파생된 완전한 오픈소스 AI 네이티브 코드 편집기입니다(Void Editor는 VS Code의 포크입니다). 편집기의 가장 깊은 수준에 AI 기능을 통합하며, 플러그인이 아니라 편집 경험의 기본적인 부분입니다. 모든 코드는 당신의 머신에 남아있습니다.

AI 요청은 **당신의 머신에서 선택한 공급자로 직접 전송됩니다**. 당신의 코드는 절대 Loophole 서버를 통과하지 않습니다. 당신의 API 키를 가져오거나 로컬 모델을 실행하고, Loophole이 나머지를 처리합니다.

완전한 에이전트 엔진, 인라인 자동 완성, 4 모드 AI 채팅 사이드바, 빠른 편집, AI 생성 Git 커밋 메시지, 음성 입력, 토큰 사용량 및 비용 추적, MCP 서버 지원 및 Claude와 OpenAI o1/o3-mini의 추론 모델 지원이 함께 제공됩니다.

## Loophole을 선택하는 이유

- **정책이 아닌 아키텍처를 통한 개인정보 보호.** 모든 AI 요청은 당신의 머신에서 공급자의 공개 API를 통해 공급자로 직접 이동합니다. Loophole 백엔드가 없고, 프롬프트 로깅이 없으며, 중개자가 없습니다.
- **4 가지 작업을 위한 4 가지 채팅 모드.** 정상 모드는 질문에 대화식으로 답변합니다. 수집 모드를 사용하면 AI가 파일에 손을 대지 않고 코드베이스를 읽고 검색할 수 있습니다. 계획 모드를 사용하면 AI가 편집을 실행하기 전에 다중 단계 계획을 시각화할 수 있습니다. 적용 모드는 일반 텍스트 설명을 한 번의 단계로 git 준비 완료 코드로 변환합니다.
- **진정한 에이전트 도구 표면.** 에이전트는 페이지 매김으로 파일을 읽고, 수술적 SEARCH/REPLACE 편집을 수행하고, 전체 파일을 다시 작성하고, 파일과 폴더를 만들고 삭제하고, 경로를 이름 변경하고 이동하고, 셸 명령을 실행하고, MCP 도구를 호출할 수 있습니다.
- **병렬 서브 에이전트.** 에이전트는 `general`(전체 도구) 또는 `researcher`(읽기 전용) 서브 에이전트를 생성하여 독립적인 부작업을 동시에 처리할 수 있습니다. 서브 에이전트는 계속 편집하는 동안 백그라운드에서 실행될 수 있습니다.
- **속도를 위해 설계된 자동 완성.** 인라인 완성 엔진은 Fill-In-the-Middle 접근 방식을 사용하여 커서 앞뒤의 코드를 전송하므로 모델이 정확히 그 사이에 무엇이 속하는지 예측할 수 있습니다. 토큰 낭비 없음, 지연 없음.
- **기능당 모델 할당.** 채팅, 빠른 편집(Ctrl+K), 자동 완성, 적용 및 Git 커밋 메시지 생성 각각은 자신의 모델 슬롯을 가집니다. 채팅에는 강력한 추론 모델을 사용하고 자동 완성에는 빠른 모델을 사용합니다.
- **완전히 로컬인 것을 포함하여 20+ 공급자.** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure OpenAI, AWS Bedrock, Ollama, vLLM, LM Studio 및 OpenAI 호환 엔드포인트.
- **추론 모델 지원.** 모델이 확장된 사고를 지원할 때 Loophole은 올바르게 구성합니다: Anthropic 스타일 추론에 대한 예산 슬라이더, OpenAI 스타일에 대한 노력 슬라이더, 사고와 결과를 모두 볼 수 있는 협업 UI.
- **MCP 서버 지원.** 외부 Model Context Protocol 서버를 연결하여 사용자 정의 도구로 에이전트를 확장합니다. MCP 도구는 에이전트 모드의 기본 제공 도구와 함께 나타나고 동일한 승인 게이트를 통과합니다.
- **토큰 사용량 및 비용 추적.** 각 응답은 입력 토큰, 출력 토큰 및 공급자별 가격 책정을 기반으로 한 추정 USD 비용을 기록합니다. 토큰 사용 대화는 누적 일일 합계 및 공급자별 분석을 보여줍니다.
- **AI 커밋 메시지.** Git SCM 패널에는 스테이징된 diff를 구성된 SCM 모델로 보내고 커밋 메시지를 Git 입력 상자에 직접 스트리밍하는 AI 버튼이 있습니다. 이는 Git에 연결되어 있으므로 Loophole에서 수정하고 푸시할 수 있습니다.
- **음성 입력.** 마이크를 사용하여 채팅에 메시지를 받아쓸 수 있습니다. Loophole은 PCM 오디오를 캡처하고 공급자를 통해 전사하고 결과로 채팅 입력을 채웁니다.
- **승인 제어.** 파일 편집, 터미널 명령 및 MCP 도구 호출 각각은 자신의 승인 범주를 가집니다. 범주당 수동 확인을 요구하거나 신뢰할 수 있는 작업에 대해 자동 승인을 전역적으로 활성화할 수 있습니다.

## 지원되는 공급자

| 공급자 | 참고 |
|----------|-------|
| Anthropic | Claude 모델, 스트리밍, 추론 지원 |
| OpenAI | GPT 및 o 시리즈 모델 |
| Google Gemini | Gemini Flash 및 Pro, 네이티브 Gemini 메시지 형식 |
| DeepSeek | DeepSeek V4 Pro 및 Flash |
| xAI | 추론 변형을 포함한 Grok 모델 |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | 초고속 추론 |
| Cohere | 추론을 포함한 Command 모델 |
| Perplexity | 웹 검색이 있는 Sonar 모델 |
| OpenRouter | 단일 API 키를 통한 200+ 모델 |
| Together AI | 오픈소스 모델 호스팅 |
| Fireworks AI | 빠른 오픈소스 추론 |
| Inception Labs | Mercury 확산 모델, 자동 완성에 최적화된 FIM |
| LiteLLM | OpenAI 호환 프록시 계층 |
| Google Vertex AI | OpenAI 호환 엔드포인트를 통한 엔터프라이즈 Google AI |
| Microsoft Azure | Azure AI Foundry 및 Azure OpenAI |
| AWS Bedrock | Amazon 관리 AI 모델 |
| Ollama | 로컬 모델 러너, 자동 감지 |
| vLLM | 로컬 고성능 추론, 자동 감지 |
| LM Studio | 로컬 GUI 모델 러너, 자동 감지 |
| OpenAI 호환 | OpenAI 호환 API가 있는 모든 사용자 정의 엔드포인트 |

## 소스에서 빌드

요구 사항: Node.js 22 이상, Python 및 C++ 빌드 도구.

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# 한 터미널에서
npm run watch

# 다른 터미널에서
npm run electron
```

## 프로젝트 구조

모든 AI 특정 코드는 `src/vs/workbench/contrib/void/` 아래에 있습니다. `browser/` 레이어는 자동 완성 엔진, 컨텍스트 수집 서비스, SCM 통합, 사이드바 및 빠른 편집 창, 채팅 UI를 포함합니다. `common/` 레이어는 공유 타입과 상수를 정의합니다. `electron/` 레이어는 Electron 통합 및 시스템 통합을 처리합니다.

`extensions/` 디렉토리는 모든 표준 VS Code 기본 제공 확장 및 `theme-loophole`(Loophole의 사용자 정의 다크 테마)을 포함합니다. `cli/` 디렉토리는 Rust 기반 CLI 도구를 포함합니다. 빌드 스크립트 및 패키징 구성은 루트에 있습니다.

## AI 요청이 어떻게 흐르는가

사용자 작업 — 채팅 메시지 전송, Ctrl+K 누르기 또는 편집기에 입력 — 관련 서비스를 트리거합니다. 해당 서비스는 `contextGatheringService`를 호출하여 열린 파일, 현재 선택, git 기록 및 활성 터미널에서 컨텍스트를 수집합니다. 수집된 컨텍스트가 에이전트로 전송되고 다중 턴 에이전트 루프를 실행합니다. 에이전트 작업(편집, 파일 생성, 셸 명령, MCP 도구 호출)은 실행 또는 승인을 위해 편집기로 다시 라우팅됩니다.

## 기여하기

커뮤니티의 기여를 환영합니다. pull request를 제출하기 전에 [기여 가이드](../../HOW_TO_CONTRIBUTE.md)를 읽어주세요. 코드베이스에 대한 자세한 기술 개요는 [코드베이스 가이드](../../LOOPHOLE_CODEBASE_GUIDE.md)를 참조하세요.

## 라이선스

Loophole은 [GNU Affero General Public License v3.0](../../LICENSE.txt)(AGPL-3.0) 아래에서 라이선스됩니다. [Void Editor](https://github.com/voideditor/void)(Apache 2.0) 및 [VS Code](https://github.com/microsoft/vscode)(MIT)의 코드를 통합합니다.
