![Loophole — The AI IDE that thinks while you code](logo/20260327_123133.png)

# Loophole

Loophole is an open-source AI code editor. It is a fork of the Void editor, which is a fork of VS Code.

## Project Background

Loophole is built on top of the Void editor. Void itself started as a fork of VS Code to integrate AI features directly into the core editor experience. Loophole continues this mission with a focus on privacy, flexibility, and a premium user experience.

## Main Features

- AI Chat Sidebar: Chat with your entire codebase using advanced AI models.
- Context Awareness: Loophole understands your code structure and relationships.
- Multiple Providers: Connect to various AI providers or host your own.
- Privacy First: AI requests are sent directly from your machine to the provider. No intermediate servers store your data.

## Supported AI Providers

Loophole supports a wide range of AI providers, including:

- Anthropic (Claude 3.5 Sonnet, etc.)
- OpenAI (GPT-4o, etc.)
- Google Gemini (Gemini 1.5 Pro/Flash)
- DeepSeek
- OpenRouter (Aggregator for many models)
- Local Providers:
  - Ollama
  - vLLM
  - LM Studio
- Other compatible providers: Groq, xAI, Mistral, Perplexity, and more.

## Installation and Run

To build and run Loophole from source:

1. System Requirements:
   - Node.js version 20 or higher.
   - Python (required for some build tools).
   - C++ build tools (required for native modules).

2. Setup:
   ```bash
   npm install
   ```

3. Build UI Components:
   ```bash
   npm run buildreact
   ```

4. Compile and Run:
   ```bash
   npm run watch
   # In another terminal:
   npm run electron
   ```

## More Information

- [LOOPHOLE_CODEBASE_GUIDE.md](./LOOPHOLE_CODEBASE_GUIDE.md) - Technical overview of the project.
- [HOW_TO_CONTRIBUTE.md](./HOW_TO_CONTRIBUTE.md) - How to help improve Loophole.

## License

Loophole is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
See LICENSE.txt for details.

## Author

Garv Agnihotri, Open Source
