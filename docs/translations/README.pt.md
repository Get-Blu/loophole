<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
O editor de código AI de código aberto que pensa enquanto você codifica.
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>Documentação</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>Contribuir</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>Problemas</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>Discussões</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole é um editor de código nativo de IA completamente de código aberto, derivado do Void Editor (que é um fork do VS Code). Ele integra capacidades de IA no nível mais profundo do editor — não como um plugin, mas como uma parte fundamental da experiência de edição. Todo o seu código permanece na sua máquina.

As solicitações de IA são enviadas **diretamente da sua máquina para o provedor de sua escolha**. Seu código nunca passa por um servidor Loophole. Você traz sua própria chave de API ou executa modelos locais, e Loophole cuida do resto.

Ele vem com um mecanismo de agente completo, preenchimento automático inline, barra lateral de chat com quatro modos, Edição Rápida, mensagens de commit Git geradas por IA, entrada de voz, rastreamento de uso de tokens e custos, suporte a servidores MCP e suporte a modelos de raciocínio para Claude e OpenAI o1/o3-mini.

## Por que Loophole

- **Privacidade por arquitetura, não por política.** Cada solicitação de IA vai diretamente da sua máquina para o provedor sobre sua API pública. Não há backend Loophole, sem registro de prompts e sem intermediários.
- **Quatro modos de chat para quatro tipos de trabalho.** O modo Normal responde perguntas conversacionalmente. O modo Gather permite que a IA leia e pesquise sua base de código sem tocar em arquivos. O modo Plan permite que a IA faça um plano multietapas visível antes de executar edições. O modo Apply converte uma descrição em texto simples em código pronto para git em uma única etapa.
- **Uma verdadeira superfície de ferramentas de agente.** O agente pode ler arquivos com paginação, fazer edições SEARCH/REPLACE cirúrgicas, reescrever arquivos inteiros, criar e deletar arquivos e pastas, renomear e mover caminhos, executar comandos shell e invocar ferramentas MCP.
- **Sub-agentes paralelos.** O agente pode gerar sub-agentes `general` (ferramentas completas) ou `researcher` (somente leitura) para lidar com subtarefas independentes simultaneamente. Sub-agentes podem ser executados em segundo plano enquanto você continua editando.
- **Preenchimento automático construído para velocidade.** O mecanismo de conclusão inline usa uma abordagem Fill-In-the-Middle, enviando o código antes e depois do cursor para que o modelo preveja exatamente o que pertence no meio. Sem desperdício de tokens, sem latência.
- **Atribuição de modelo por recurso.** Chat, Edição Rápida (Ctrl+K), Preenchimento automático, Aplicar e geração de mensagens de commit Git cada uma tem seu próprio espaço de modelo. Use um modelo de raciocínio poderoso para chat e um modelo rápido para preenchimento automático.
- **20+ provedores, incluindo completamente locais.** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure OpenAI, AWS Bedrock, Ollama, vLLM, LM Studio e endpoints compatíveis com OpenAI.
- **Suporte a modelos de raciocínio.** Quando um modelo suporta pensamento estendido, Loophole o configura corretamente: controles deslizantes de orçamento para raciocínio estilo Anthropic, controles deslizantes de esforço para estilo OpenAI e uma interface colaborativa para que você veja tanto o pensamento quanto o resultado.
- **Suporte a servidores MCP.** Conecte servidores Model Context Protocol externos para estender o agente com ferramentas personalizadas. As ferramentas MCP aparecem ao lado das ferramentas integradas no modo Agent e passam pelos mesmos portões de aprovação.
- **Rastreamento de uso de tokens e custos.** Cada resposta registra tokens de entrada, tokens de saída e um custo estimado em USD com base na precificação por provedor. Um diálogo de Uso de Tokens mostra totais diários cumulativos e análises por provedor.
- **Mensagens de commit de IA.** O painel Git SCM tem um botão de IA que envia seu diff em etapas para o modelo SCM configurado e transmite uma mensagem de commit diretamente para a caixa de entrada do Git. Isso está conectado ao Git para que você possa corrigir e fazer push a partir do Loophole.
- **Entrada de voz.** Você pode ditar mensagens para o chat usando seu microfone. Loophole captura áudio PCM, transcreve-o através do provedor e preenche a entrada de chat com o resultado.
- **Controles de aprovação.** Edições de arquivo, comandos de terminal e chamadas de ferramentas MCP cada uma têm sua própria categoria de aprovação. Você pode exigir confirmação manual por categoria ou ativar auto-aprovação globalmente para operações confiáveis.

## Provedores suportados

| Provedor | Notas |
|----------|-------|
| Anthropic | Modelos Claude, streaming, suporte a raciocínio |
| OpenAI | Modelos GPT e série o |
| Google Gemini | Gemini Flash e Pro, formato de mensagem Gemini nativo |
| DeepSeek | DeepSeek V4 Pro e Flash |
| xAI | Modelos Grok incluindo variantes de raciocínio |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | Inferência ultra-rápida |
| Cohere | Modelos Command incluindo raciocínio |
| Perplexity | Modelos Sonar com busca na web |
| OpenRouter | 200+ modelos via uma única chave de API |
| Together AI | Hospedagem de modelo de código aberto |
| Fireworks AI | Inferência de código aberto rápida |
| Inception Labs | Modelos de difusão Mercury, otimizado FIM para preenchimento automático |
| LiteLLM | Camada proxy compatível com OpenAI |
| Google Vertex AI | IA empresarial do Google via endpoint compatível com OpenAI |
| Microsoft Azure | Azure AI Foundry e Azure OpenAI |
| AWS Bedrock | Modelos de IA gerenciados pela Amazon |
| Ollama | Executor de modelo local, detectado automaticamente |
| vLLM | Inferência local de alto desempenho, detectado automaticamente |
| LM Studio | Executor de modelo GUI local, detectado automaticamente |
| Compatível com OpenAI | Qualquer endpoint personalizado com API compatível com OpenAI |

## Compilar a partir da fonte

Requisitos: Node.js 22 ou superior, Python e ferramentas de compilação C++.

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# Em um terminal
npm run watch

# Em outro terminal
npm run electron
```

## Estrutura do projeto

Todo o código específico de IA reside em `src/vs/workbench/contrib/void/`. A camada `browser/` contém o mecanismo de preenchimento automático, serviço de coleta de contexto, integração SCM, painéis de barra lateral e Edição Rápida, e interface de usuário de chat. A camada `common/` define tipos compartilhados e constantes. A camada `electron/` manipula a integração do Electron e integração do sistema.

O diretório `extensions/` contém todas as extensões integradas padrão do VS Code mais `theme-loophole`, o tema escuro personalizado do Loophole. O diretório `cli/` contém ferramentas CLI baseadas em Rust. Scripts de compilação e configuração de empacotamento estão na raiz.

## Como as solicitações de IA fluem

Uma ação do usuário — envio de uma mensagem de chat, pressionar Ctrl+K ou digitar no editor — dispara o serviço relevante. Esse serviço chama `contextGatheringService` para montar o contexto a partir de arquivos abertos, seleção atual, histórico git e terminal ativo. O contexto montado é enviado para o agente, que executa um loop de agente multiturn. As ações do agente (edições, criação de arquivo, comandos shell, chamadas de ferramentas MCP) são roteadas de volta para o editor para execução ou aprovação.

## Contribuindo

Bem-vindo às contribuições da comunidade. Por favor, leia o [Guia de Contribuição](../../HOW_TO_CONTRIBUTE.md) antes de enviar um pull request. Para uma visão técnica profunda da base de código, consulte o [Guia da Base de Código](../../LOOPHOLE_CODEBASE_GUIDE.md).

## Licença

Loophole é licenciado sob a [Licença Pública Geral GNU Affero v3.0](../../LICENSE.txt) (AGPL-3.0). Ele incorpora código de [Void Editor](https://github.com/voideditor/void) (Apache 2.0) e [VS Code](https://github.com/microsoft/vscode) (MIT).
