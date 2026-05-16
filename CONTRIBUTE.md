# Contributing to Loophole

Loophole is an open-source AI code editor and we welcome your help!

## Development Environment Setup

To set up Loophole for local development, follow these steps:

1. Prerequisites:
   - Node.js version 20 or higher.
   - Python 3.x (to build native modules).
   - A C++ compiler (Visual Studio build tools for Windows, Xcode for macOS, or GCC for Linux).

2. Installation:
   ```bash
   npm install
   ```

3. Build UI Components:
   ```bash
   npm run buildreact
   ```

4. Run the Editor:
   ```bash
   npm run watch
   # Open another terminal and run electron:
   npm run electron
   ```

## Repository Structure

Loophole is a fork of Void, which is a fork of VS Code. The core AI implementation is located in:
src/vs/workbench/contrib/void/

This directory contains the main AI sidebar, settings, and message handling services.

## Development Workflow

When contributing to Loophole:
- Follow the existing VS Code and Void code styles.
- Use TypeScript and ensure proper types are maintained. Do not cast to 'any'.
- Use the provided Services and Actions for new features.
- Test your changes locally before submitting a pull request.

## Pull Requests

1. Fork the repository.
2. Create a feature branch for your changes.
3. Submit a pull request with a clear description of your work.
4. Do not include emojis in your commit messages or pull request descriptions.
5. Be prepared for code review and feedback.

## Legal Information

Loophole is licensed under the MIT License. By contributing to Loophole, you agree to license your contributions under the same terms.
