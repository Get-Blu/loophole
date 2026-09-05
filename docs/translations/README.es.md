<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
El editor de código AI de código abierto que piensa mientras codificas.
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>Documentación</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>Contribuir</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>Problemas</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>Discusiones</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole es un editor de código nativo de AI completamente de código abierto, derivado de Void Editor (que a su vez es un fork de VS Code). Integra capacidades de AI en el nivel más profundo del editor — no como un complemento sino como una parte fundamental de la experiencia de edición. Todo el código permanece en tu máquina.

Las solicitudes de AI se envían **directamente desde tu máquina al proveedor elegido**. Tu código nunca pasa por un servidor de Loophole. Aportas tu propia clave de API o ejecutas modelos locales, y Loophole se encarga del resto.

Viene con un motor de agente completo, autocompletado en línea, barra lateral de chat con cuatro modos, Edición Rápida, mensajes de confirmación de Git generados por AI, entrada de voz, seguimiento de uso de tokens y costo, soporte para servidores MCP, y soporte para modelos de razonamiento para Claude y OpenAI o1/o3-mini.

## Por qué Loophole

- **Privacidad por arquitectura, no por política.** Cada solicitud de AI va directamente desde tu máquina al proveedor sobre su API pública. No hay backend de Loophole, no hay registros de prompts, y no hay intermediarios.
- **Cuatro modos de chat para cuatro tipos de trabajo.** El modo Normal responde preguntas conversacionalmente. El modo Recopilar permite que la AI lea y busque en tu base de código sin tocar archivos. El modo Plan permite que la AI haga un plan multitarea visible antes de ejecutar ediciones. El modo Aplicar convierte una descripción de texto sin formato en código listo para git en un solo paso.
- **Una superficie de herramientas de agente real.** El agente puede leer archivos con paginación, hacer ediciones quirúrgicas de SEARCH/REPLACE, reescribir archivos completos, crear y eliminar archivos y carpetas, renombrar y mover rutas, ejecutar comandos de shell, e invocar herramientas MCP.
- **Sub-agentes paralelos.** El agente puede generar sub-agentes `general` (herramientas completas) o `researcher` (solo lectura) para manejar subtareas independientes concurrentemente. Los sub-agentes pueden ejecutarse en segundo plano mientras continúas editando.
- **Autocompletado construido para velocidad.** El motor de finalización en línea utiliza un enfoque Fill-In-the-Middle, enviando el código antes y después del cursor para que el modelo prediga exactamente qué pertenece en medio. Sin desperdicio de tokens, sin retrasos.
- **Asignación de modelo por característica.** Chat, Edición Rápida (Ctrl+K), Autocompletado, Aplicar y generación de mensajes de confirmación de Git cada una tiene su propio espacio de modelo. Usa un modelo de razonamiento poderoso para chat y un modelo rápido para autocompletado.
- **20+ proveedores, incluyendo completamente locales.** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure OpenAI, AWS Bedrock, Ollama, vLLM, LM Studio, y endpoints compatibles con OpenAI.
- **Soporte para modelos de razonamiento.** Cuando un modelo soporta pensamiento extendido, Loophole lo configura correctamente: deslizadores de presupuesto para razonamiento estilo Anthropic, deslizadores de esfuerzo para estilo OpenAI, y una UI colaborativa para que veas tanto el pensamiento como el resultado.
- **Soporte para servidores MCP.** Conecta servidores externos de Model Context Protocol para extender el agente con herramientas personalizadas. Las herramientas MCP aparecen junto a herramientas integradas en modo Agent y pasan por las mismas puertas de aprobación.
- **Seguimiento de uso de tokens y costo.** Cada respuesta registra tokens de entrada, tokens de salida, y un costo estimado en USD basado en precios por proveedor. Un diálogo de Uso de Tokens muestra totales diarios acumulativos y desgloses por proveedor.
- **Mensajes de confirmación de AI.** El panel Git SCM tiene un botón de AI que envía tu diff en etapa al modelo SCM configurado y transmite un mensaje de confirmación directamente al cuadro de entrada de Git. Esto está conectado a Git para que puedas enmendar y empujar desde Loophole.
- **Entrada de voz.** Puedes dictar mensajes al chat usando tu micrófono. Loophole captura audio PCM, lo transcribe a través del proveedor, y completa el input del chat con el resultado.
- **Controles de aprobación.** Las ediciones de archivos, comandos de terminal, y llamadas a herramientas MCP cada una tienen su propia categoría de aprobación. Puedes requerir confirmación manual por categoría o habilitar auto-aprobación globalmente para operaciones confiables.

## Proveedores soportados

| Proveedor | Notas |
|----------|-------|
| Anthropic | Modelos Claude, transmisión, soporte de razonamiento |
| OpenAI | Modelos GPT y serie o |
| Google Gemini | Gemini Flash y Pro, formato de mensaje nativo Gemini |
| DeepSeek | DeepSeek V4 Pro y Flash |
| xAI | Modelos Grok incluyendo variantes de razonamiento |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | Inferencia ultra rápida |
| Cohere | Modelos Command incluyendo razonamiento |
| Perplexity | Modelos Sonar con búsqueda web |
| OpenRouter | 200+ modelos vía una sola clave API |
| Together AI | Alojamiento de modelos de código abierto |
| Fireworks AI | Inferencia de código abierto rápida |
| Inception Labs | Modelos Mercury diffusion, optimizados FIM para autocompletado |
| LiteLLM | Capa proxy compatible con OpenAI |
| Google Vertex AI | AI empresarial de Google a través de endpoint compatible con OpenAI |
| Microsoft Azure | Azure AI Foundry y Azure OpenAI |
| AWS Bedrock | Modelos AI gestionados por Amazon |
| Ollama | Ejecutor de modelo local, auto-detectado |
| vLLM | Inferencia local de alto rendimiento, auto-detectado |
| LM Studio | Ejecutor de modelo GUI local, auto-detectado |
| Compatible con OpenAI | Cualquier endpoint personalizado con API compatible con OpenAI |

## Compilar desde la fuente

Requisitos: Node.js 22 o superior, Python y herramientas de compilación C++.

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# En una terminal
npm run watch

# En otra terminal
npm run electron
```

## Estructura del proyecto

Todo el código específico de AI vive bajo `src/vs/workbench/contrib/void/`. La capa `browser/` contiene el motor de autocompletado, servicio de recopilación de contexto, integración SCM, paneles de barra lateral y Edición Rápida, y UI de chat. La capa `common/` define tipos compartidos y constantes. La capa `electron/` maneja la integración de Electron e integración del sistema.

El directorio `extensions/` contiene todas las extensiones integradas estándar de VS Code más `theme-loophole`, el tema oscuro personalizado de Loophole. El directorio `cli/` contiene herramientas CLI basadas en Rust. Los scripts de compilación y configuración de empaque están en la raíz.

## Cómo fluyen las solicitudes de AI

Una acción del usuario — enviar un mensaje de chat, presionar Ctrl+K, o escribir en el editor — dispara el servicio relevante. Ese servicio llama a `contextGatheringService` para ensamblar contexto desde archivos abiertos, la selección actual, historial de git, y la terminal activa. El contexto ensamblado se envía al agente, que ejecuta un bucle multi-turno de agente. Las acciones del agente (ediciones, creación de archivos, comandos de shell, llamadas a herramientas MCP) se redirigen al editor para ejecución o aprobación.

## Contribuyendo

Bienvenimos contribuciones de la comunidad. Por favor lee la [Guía de Contribución](../../HOW_TO_CONTRIBUTE.md) antes de enviar un pull request. Para una visión técnica profunda de la base de código, ve la [Guía de Base de Código](../../LOOPHOLE_CODEBASE_GUIDE.md).

## Licencia

Loophole está licenciado bajo la [Licencia Pública General GNU Affero v3.0](../../LICENSE.txt) (AGPL-3.0). Incorpora código de [Void Editor](https://github.com/voideditor/void) (Apache 2.0) y [VS Code](https://github.com/microsoft/vscode) (MIT).
