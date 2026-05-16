# Loophole Codebase Guide

Loophole is an AI-powered code editor built as a fork of the Void editor, which is itself a fork of the VS Code repository. This guide explains how the core AI features are integrated into the VS Code architecture.

## Folder Structure

The core AI implementation is located in the folder:
src/vs/workbench/contrib/void/

This directory follows the VS Code process-based structure:
- browser/: Code that runs on the browser process (client-side UI and logic).
- common/: Code shared between processes (types, utilities, constants).
- electron-main/: Code that runs on the main process (interacts with the system and node_modules).

## VS Code Foundation

Loophole inherits the full VS Code architecture, including:
- Services: Singleton classes registered to handle specific functionality (e.g., chatThreadService, voidSettingsService).
- Actions/Commands: Functions registered by ID that user or code can call (e.g., cmd+L to open the sidebar).
- Models and Editors: Internal representations of files and the UI elements that display them.

## The AI Sidebar (React)

The AI Sidebar is implemented using React to allow for faster development and a modern interface. The code is located in:
src/vs/workbench/contrib/void/browser/react/

To build the React sidebar components:
npm run buildreact

## AI Message Pipeline

When you send a message in the sidebar:
1. The sidebar (React) captures user input and sends it to the chatThreadService.
2. The browser process receives the message and gathers context (e.g., open files, selected code).
3. The request is passed to the electron-main process.
4. The main process sends the message directly to the provider (e.g., Anthropic, OpenAI, or local Ollama).

Sending LLM messages from the main process avoids CSP (Content Security Policy) issues and allows the use of Node.js modules more easily.

## Applying Code Changes

Loophole has two ways to apply code suggestions:

### Fast Apply
Uses Search/Replace blocks to update only the modified parts of a file. This is fast even on large files. The LLM outputs code in the following format:
<<<<<<< ORIGINAL
// original code
=======
// updated code
>>>>>>> UPDATED

### Slow Apply
Rewrites the entire file. This is more reliable for large structural changes but takes longer.

The editCodeService handles these operations and manages the red/green diff views.

## User Settings

The voidSettingsService manages everything related to models and providers. It handles API keys, endpoints, and model selection for different features like Chat, Autocomplete, and Quick Edit.
