<p align="center">
  <img src="../../logo/logo.png" width="80" alt="Loophole" />
</p>

<h1 align="center">Loophole IDE</h1>

<p align="center">
L'éditeur de code IA open-source qui réfléchit pendant que vous codez.
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
<td align="center"><a href="../../LOOPHOLE_CODEBASE_GUIDE.md"><strong>Documentation</strong></a></td>
<td align="center"><a href="../../HOW_TO_CONTRIBUTE.md"><strong>Contribuer</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/issues"><strong>Problèmes</strong></a></td>
<td align="center"><a href="https://github.com/loophole-ai/loophole-ide/discussions"><strong>Discussions</strong></a></td>
</tbody>
</table>

</div>

<br>

<p align="center">
  <img src="../../logo/20260327_123134.png" width="100%" alt="Loophole Editor" />
</p>

Loophole est un éditeur de code natif IA complètement open-source, dérivé de Void Editor (qui est lui-même un fork de VS Code). Il intègre les capacités d'IA au plus profond de l'éditeur — non pas comme un plugin mais comme une partie fondamentale de l'expérience d'édition. Tout votre code reste sur votre machine.

Les requêtes d'IA sont envoyées **directement de votre machine vers le fournisseur de votre choix**. Votre code ne passe jamais par un serveur Loophole. Vous apportez votre propre clé API ou exécutez des modèles locaux, et Loophole gère le reste.

Il est livré avec un moteur d'agent complet, une autocomplétion en ligne, une barre latérale de chat à quatre modes, Édition rapide, des messages de commit Git générés par IA, entrée vocale, suivi de l'utilisation des tokens et des coûts, support des serveurs MCP, et support des modèles de raisonnement pour Claude et OpenAI o1/o3-mini.

## Pourquoi Loophole

- **Vie privée par architecture, pas par politique.** Chaque requête d'IA va directement de votre machine au fournisseur sur son API publique. Il n'y a pas de backend Loophole, pas de journalisation des prompts, pas d'intermédiaires.
- **Quatre modes de chat pour quatre types de travail.** Le mode Normal répond aux questions de manière conversationnelle. Le mode Recueillir permet à l'IA de lire et de rechercher dans votre base de code sans toucher à aucun fichier. Le mode Plan permet à l'IA d'élaborer un plan multi-étapes visible avant d'exécuter les modifications. Le mode Appliquer convertit une description en texte brut en code prêt pour git en une seule étape.
- **Une véritable surface d'outils d'agent.** L'agent peut lire des fichiers avec pagination, effectuer des modifications SEARCH/REPLACE chirurgicales, réécrire des fichiers entiers, créer et supprimer des fichiers et dossiers, renommer et déplacer des chemins, exécuter des commandes shell, et invoquer des outils MCP.
- **Sous-agents parallèles.** L'agent peut générer des sous-agents `general` (outils complets) ou `researcher` (lecture seule) pour gérer les sous-tâches indépendantes de manière concurrente. Les sous-agents peuvent s'exécuter en arrière-plan pendant que vous continuez à éditer.
- **Autocomplétion construite pour la vitesse.** Le moteur de complétion en ligne utilise une approche Fill-In-the-Middle, envoyant le code avant et après le curseur pour que le modèle prédise exactement ce qui devrait se trouver entre les deux. Pas de gaspillage de tokens, pas de latence.
- **Attribution de modèle par fonctionnalité.** Chat, Édition rapide (Ctrl+K), Autocomplétion, Appliquer et génération de messages de commit Git ont chacun leur propre créneau de modèle. Utilisez un modèle de raisonnement puissant pour le chat et un modèle rapide pour l'autocomplétion.
- **20+ fournisseurs, y compris complètement locaux.** Anthropic, OpenAI, Google Gemini, DeepSeek, xAI, Mistral, Groq, Cohere, Perplexity, OpenRouter, Together AI, Fireworks AI, Inception Labs, LiteLLM, Vertex AI, Azure OpenAI, AWS Bedrock, Ollama, vLLM, LM Studio, et points de terminaison compatibles OpenAI.
- **Support des modèles de raisonnement.** Lorsqu'un modèle prend en charge la réflexion étendue, Loophole le configure correctement : curseurs de budget pour le raisonnement de style Anthropic, curseurs d'effort pour le style OpenAI, et une interface de collaboration pour que vous voyiez à la fois la réflexion et le résultat.
- **Support des serveurs MCP.** Connectez des serveurs Model Context Protocol externes pour étendre l'agent avec des outils personnalisés. Les outils MCP apparaissent aux côtés des outils intégrés en mode Agent et passent par les mêmes portes d'approbation.
- **Suivi de l'utilisation des tokens et des coûts.** Chaque réponse enregistre les tokens d'entrée, les tokens de sortie, et un coût estimé en USD basé sur la tarification par fournisseur. Un dialogue d'utilisation des tokens affiche les totaux quotidiens cumulés et les ventilations par fournisseur.
- **Messages de commit IA.** Le panneau Git SCM a un bouton IA qui envoie votre diff par étape au modèle SCM configuré et diffuse un message de commit directement dans la zone de saisie Git. Ceci est intégré à Git pour que vous puissiez amender et pousser depuis Loophole.
- **Entrée vocale.** Vous pouvez dicter des messages au chat à l'aide de votre microphone. Loophole capture l'audio PCM, le transcrit via le fournisseur, et remplit l'entrée du chat avec le résultat.
- **Contrôles d'approbation.** Les modifications de fichiers, les commandes de terminal et les appels d'outils MCP ont chacun leur propre catégorie d'approbation. Vous pouvez exiger une confirmation manuelle par catégorie ou activer l'approbation automatique globalement pour les opérations de confiance.

## Fournisseurs pris en charge

| Fournisseur | Notes |
|----------|-------|
| Anthropic | Modèles Claude, streaming, support du raisonnement |
| OpenAI | Modèles GPT et série o |
| Google Gemini | Gemini Flash et Pro, format de message Gemini natif |
| DeepSeek | DeepSeek V4 Pro et Flash |
| xAI | Modèles Grok y compris les variantes de raisonnement |
| Mistral | Mistral Large, Magistral, Codestral, Devstral |
| Groq | Inférence ultra-rapide |
| Cohere | Modèles Command y compris le raisonnement |
| Perplexity | Modèles Sonar avec recherche web |
| OpenRouter | 200+ modèles via une seule clé API |
| Together AI | Hébergement de modèles open-source |
| Fireworks AI | Inférence open-source rapide |
| Inception Labs | Modèles de diffusion Mercury, optimisés FIM pour l'autocomplétion |
| LiteLLM | Couche proxy compatible OpenAI |
| Google Vertex AI | IA d'entreprise Google via point de terminaison compatible OpenAI |
| Microsoft Azure | Azure AI Foundry et Azure OpenAI |
| AWS Bedrock | Modèles d'IA gérés par Amazon |
| Ollama | Exécuteur de modèle local, auto-détecté |
| vLLM | Inférence locale haute performance, auto-détectée |
| LM Studio | Exécuteur de modèle GUI local, auto-détecté |
| Compatible OpenAI | N'importe quel point de terminaison personnalisé avec API compatible OpenAI |

## Construire à partir de la source

Prérequis : Node.js 22 ou supérieur, Python et outils de compilation C++.

```bash
git clone https://github.com/loophole-ai/loophole-ide.git
cd loophole-ide

npm install
npm run buildreact

# Dans un terminal
npm run watch

# Dans un autre terminal
npm run electron
```

## Structure du projet

Tout le code spécifique à l'IA se trouve sous `src/vs/workbench/contrib/void/`. La couche `browser/` contient le moteur d'autocomplétion, le service de collecte de contexte, l'intégration SCM, les panneaux de barre latérale et Édition rapide, et l'interface utilisateur du chat. La couche `common/` définit les types partagés et les constantes. La couche `electron/` gère l'intégration Electron et l'intégration du système.

Le répertoire `extensions/` contient toutes les extensions intégrées standard de VS Code plus `theme-loophole`, le thème sombre personnalisé de Loophole. Le répertoire `cli/` contient les outils CLI basés sur Rust. Les scripts de construction et la configuration de l'empaquetage sont à la racine.

## Comment les requêtes d'IA circulent

Une action utilisateur — envoi d'un message de chat, appui sur Ctrl+K ou saisie dans l'éditeur — déclenche le service pertinent. Ce service appelle `contextGatheringService` pour assembler le contexte à partir des fichiers ouverts, de la sélection actuelle, de l'historique git et du terminal actif. Le contexte assemblé est envoyé à l'agent, qui exécute une boucle multi-tours d'agent. Les actions de l'agent (modifications, création de fichiers, commandes shell, appels aux outils MCP) sont acheminées vers l'éditeur pour exécution ou approbation.

## Contribuer

Nous accueillons les contributions de la communauté. Veuillez lire le [Guide de contribution](../../HOW_TO_CONTRIBUTE.md) avant de soumettre une demande de tirage. Pour une vue technique approfondie de la base de code, consultez le [Guide de la base de code](../../LOOPHOLE_CODEBASE_GUIDE.md).

## Licence

Loophole est licencié selon la [Licence publique générale GNU Affero v3.0](../../LICENSE.txt) (AGPL-3.0). Il incorpore du code de [Void Editor](https://github.com/voideditor/void) (Apache 2.0) et [VS Code](https://github.com/microsoft/vscode) (MIT).
