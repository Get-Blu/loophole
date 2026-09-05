<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
Der Open-Source-KI-Code-Editor, der denkt, während Sie kodieren.
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>Dokumentation</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>Beitragen</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>Probleme</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>Diskussionen</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole ist ein vollständig Open-Source-KI-nativer Code-Editor, der von Void Editor abgeleitet ist (das selbst ein Fork von VS Code ist). Er integriert KI-Funktionen auf der tiefsten Ebene des Editors — nicht als Plugin, sondern als grundlegender Bestandteil der Bearbeitungserfahrung. Ihr gesamter Code bleibt auf Ihrem Rechner.

KI-Anfragen werden **direkt von Ihrem Rechner an Ihren gewählten Anbieter gesendet**. Ihr Code passiert niemals einen Loophole-Server. Sie bringen Ihren eigenen API-Schlüssel mit oder führen lokale Modelle aus, und Loophole kümmert sich um den Rest.

Es wird mit einer vollständigen Agenten-Engine, Inline-Autovervollständigung, einer viermodi AI-Chat-Seitenleiste, Quick Edit, KI-generierten Git-Commit-Nachrichten, Spracheingabe, Token-Verwendungs- und Kostenverfolgung, MCP-Server-Unterstützung sowie Unterstützung für Reasoning-Modelle für Claude und OpenAI o1/o3-mini ausgeliefert.

## Warum Loophole

- **Datenschutz durch Architektur, nicht Richtlinie.** Jede KI-Anfrage geht direkt von Ihrem Rechner über die öffentliche API an den Anbieter. Es gibt keinen Loophole-Backend, kein Prompt-Logging und keine Zwischenhändler.
- **Vier Chat-Modi für vier Arten von Arbeit.** Der Normalmodus beantwortet Fragen gesprächsweise. Der Sammelmodus ermöglicht der KI, Ihre Codebasis zu lesen und zu durchsuchen, ohne Dateien zu berühren. Der Planmodus ermöglicht der KI, einen mehrstufigen Plan sichtbar zu machen, bevor Änderungen durchgeführt werden. Der Anwendungsmodus wandelt eine einfache Textbeschreibung in einem Schritt in git-bereite Code um.
- **Eine echte Agenten-Tool-Oberfläche.** Der Agent kann Dateien mit Pagination lesen, chirurgische SEARCH/REPLACE-Änderungen durchführen, ganze Dateien umschreiben, Dateien und Ordner erstellen und löschen, Pfade umbenennen und verschieben, Shell-Befehle ausführen sowie MCP-Tools aufrufen.
- **Parallele Sub-Agenten.** Der Agent kann `general` (vollständige Tools) oder `researcher` (schreibgeschützt) Sub-Agenten erzeugen, um unabhängige Subtasks gleichzeitig zu bearbeiten. Sub-Agenten können im Hintergrund laufen, während Sie weiter bearbeiten.
- **Autovervollständigung für Geschwindigkeit.** Die Inline-Completion-Engine verwendet einen Fill-In-the-Middle-Ansatz und sendet den Code vor und nach dem Cursor, damit das Modell genau vorhersagen kann, was dazwischen gehört. Kein Token-Verschwendung, keine Verzögerung.
- **Modellzuweisung pro Funktion.** Chat, Quick Edit (Strg+K), Autovervollständigung, Apply und Git-Commit-Nachrichtengenerierung haben jeweils ihren eigenen Modellplatz. Verwenden Sie ein leistungsstarkes Reasoning-Modell für Chat und ein schnelles Modell für Autovervollständigung.
- **20+ Anbieter, einschließlich vollständig lokaler.** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure OpenAI, AWS Bedrock, Ollama, vLLM, LM Studio und OpenAI-kompatible Endpunkte.
- **Unterstützung für Reasoning-Modelle.** Wenn ein Modell erweitertes Denken unterstützt, konfiguriert Loophole es korrekt: Budget-Schieberegler für Anthropic-Stil-Reasoning, Aufwandsschieberegler für OpenAI-Stil und eine kollaborative Benutzeroberfläche, damit Sie sowohl das Denken als auch das Ergebnis sehen.
- **MCP-Server-Unterstützung.** Verbinden Sie externe Model Context Protocol-Server, um den Agent mit benutzerdefinierten Tools zu erweitern. MCP-Tools erscheinen neben integrierten Tools im Agent-Modus und durchlaufen dieselben Genehmigungstore.
- **Token-Verwendungs- und Kostenverfolgung.** Jede Antwort zeichnet Eingabe-Tokens, Ausgabe-Tokens und geschätzte USD-Kosten basierend auf anbieterspezifischer Preisgestaltung auf. Ein Token-Verwendungsdialog zeigt kumulative tägliche Gesamtwerte und Aufschlüsselungen pro Anbieter.
- **KI-Commit-Nachrichten.** Das Git-SCM-Panel hat eine KI-Schaltfläche, die Ihren bereitgestellten Diff an das konfigurierte SCM-Modell sendet und eine Commit-Nachricht direkt in das Git-Eingabefeld streamt. Dies ist mit Git verbunden, sodass Sie von Loophole aus ändern und übertragen können.
- **Spracheingabe.** Sie können Nachrichten im Chat mit Ihrem Mikrofon diktieren. Loophole erfasst PCM-Audio, transkribiert es über den Anbieter und füllt die Chat-Eingabe mit dem Ergebnis.
- **Genehmigungskontrollen.** Dateiänderungen, Terminal-Befehle und MCP-Tool-Aufrufe haben jeweils ihre eigene Genehmigungskategorie. Sie können für jede Kategorie manuelle Bestätigung anfordern oder die automatische Genehmigung global für vertrauenswürdige Operationen aktivieren.

## Unterstützte Anbieter

| Anbieter | Notizen |
|----------|-------|
| Anthropic | Claude-Modelle, Streaming, Reasoning-Unterstützung |
| OpenAI | GPT und o-Serie Modelle |
| Google Gemini | Gemini Flash und Pro, natives Gemini-Nachrichtenformat |
| DeepSeek | DeepSeek V4 Pro und Flash |
| xAI | Grok-Modelle inkl. Reasoning-Varianten |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | Ultra-schnelle Inferenz |
| Cohere | Command-Modelle inkl. Reasoning |
| Perplexity | Sonar-Modelle mit Websuche |
| OpenRouter | 200+ Modelle über einen einzelnen API-Schlüssel |
| Together AI | Open-Source-Modell-Hosting |
| Fireworks AI | Schnelle Open-Source-Inferenz |
| Inception Labs | Mercury-Diffusionsmodelle, FIM-optimiert für Autovervollständigung |
| LiteLLM | OpenAI-kompatible Proxy-Schicht |
| Google Vertex AI | Enterprise Google KI über OpenAI-kompatiblen Endpunkt |
| Microsoft Azure | Azure AI Foundry und Azure OpenAI |
| AWS Bedrock | Von Amazon verwaltete KI-Modelle |
| Ollama | Lokaler Modell-Runner, automatisch erkannt |
| vLLM | Lokale leistungsstarke Inferenz, automatisch erkannt |
| LM Studio | Lokaler GUI-Modell-Runner, automatisch erkannt |
| OpenAI-kompatibel | Beliebiger benutzerdefinierter Endpunkt mit OpenAI-kompatibler API |

## Aus dem Quellcode erstellen

Anforderungen: Node.js 22 oder höher, Python und C++-Build-Tools.

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# In einem Terminal
npm run watch

# In einem anderen Terminal
npm run electron
```

## Projektstruktur

Der gesamte KI-spezifische Code befindet sich unter `src/vs/workbench/contrib/void/`. Die `browser/`-Schicht enthält die Autovervollständigungs-Engine, den Kontext-Erfassungsdienst, die SCM-Integration, Seitenlisten- und Quick-Edit-Panels sowie die Chat-Benutzeroberfläche. Die `common/`-Schicht definiert gemeinsame Typen und Konstanten. Die `electron/`-Schicht kümmert sich um die Electron-Integration und Systemintegration.

Das `extensions/`-Verzeichnis enthält alle Standard-VS-Code-integrierten Erweiterungen sowie `theme-loophole`, Loopholes benutzerdefiniertes dunkles Design. Das `cli/`-Verzeichnis enthält Rust-basierte CLI-Tools. Build-Skripte und Verpackungskonfiguration befinden sich im Root.

## Wie KI-Anfragen fließen

Eine Benutzeraktion — Senden einer Chat-Nachricht, Drücken von Strg+K oder Eingabe im Editor — löst den relevanten Dienst aus. Dieser Dienst ruft `contextGatheringService` auf, um Kontext aus offenen Dateien, der aktuellen Auswahl, der Git-Historie und dem aktiven Terminal zusammenzustellen. Der zusammengestellte Kontext wird an den Agent gesendet, der eine mehrstufige Agenten-Schleife ausführt. Agent-Aktionen (Änderungen, Dateierstellung, Shell-Befehle, MCP-Tool-Aufrufe) werden zur Ausführung oder Genehmigung an den Editor zurückgeleitet.

## Beitragen

Wir freuen uns über Beiträge aus der Gemeinschaft. Bitte lesen Sie das [Beitragshandbuch](../../HOW_TO_CONTRIBUTE.md), bevor Sie einen Pull Request einreichen. Eine tiefgreifende technische Übersicht der Codebasis finden Sie im [Codebase-Handbuch](../../LOOPHOLE_CODEBASE_GUIDE.md).

## Lizenz

Loophole ist lizenziert unter der [GNU Affero General Public License v3.0](../../LICENSE.txt) (AGPL-3.0). Es enthält Code von [Void Editor](https://github.com/voideditor/void) (Apache 2.0) und [VS Code](https://github.com/microsoft/vscode) (MIT).
