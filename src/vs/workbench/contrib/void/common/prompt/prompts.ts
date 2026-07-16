/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { URI } from '../../../../../base/common/uri.js';
import { IFileService } from '../../../../../platform/files/common/files.js';
import { IDirectoryStrService } from '../directoryStrService.js';
import { StagingSelectionItem } from '../chatThreadServiceTypes.js';
import { os } from '../helpers/systemInfo.js';
import { RawToolParamsObj } from '../sendLLMMessageTypes.js';
import { approvalTypeOfBuiltinToolName, BuiltinToolCallParams, BuiltinToolName, BuiltinToolResultType, ToolName } from '../toolsServiceTypes.js';
import { ChatMode, ProviderName } from '../voidSettingsTypes.js';
import { prompt_anthropic, prompt_gpt, prompt_gemini, prompt_default, prompt_plan_mode, prompt_plan_reminder_anthropic, prompt_deepseek, prompt_xai, prompt_mistral, prompt_groq, prompt_ollama, prompt_vllm, prompt_litellm, prompt_openrouter, prompt_openai_compatible, prompt_lmstudio, prompt_cohere, prompt_perplexity, prompt_togetherai, prompt_fireworksai, prompt_googlevertex, prompt_microsoftazure, prompt_awsbedrock } from './modelPrompts.js';

// Triple backtick wrapper used throughout the prompts for code blocks
export const tripleTick = ['```', '```']

// Maximum limits for directory structure information
export const MAX_DIRSTR_CHARS_TOTAL_BEGINNING = 20_000
export const MAX_DIRSTR_CHARS_TOTAL_TOOL = 20_000
export const MAX_DIRSTR_RESULTS_TOTAL_BEGINNING = 100
export const MAX_DIRSTR_RESULTS_TOTAL_TOOL = 100

// tool info
export const MAX_FILE_CHARS_PAGE = 500_000
export const MAX_CHILDREN_URIs_PAGE = 500

// terminal tool info
export const MAX_TERMINAL_CHARS = 100_000
export const MAX_TERMINAL_INACTIVE_TIME = 16 // seconds
export const MAX_TERMINAL_BG_COMMAND_TIME = 5


// Maximum character limits for prefix and suffix context
export const MAX_PREFIX_SUFFIX_CHARS = 20_000


export const ORIGINAL = `<<<<<<< ORIGINAL`
export const DIVIDER = `=======`
export const FINAL = `>>>>>>> UPDATED`



const searchReplaceBlockTemplate = `\
${ORIGINAL}
// ... original code goes here
${DIVIDER}
// ... final code goes here
${FINAL}

${ORIGINAL}
// ... original code goes here
${DIVIDER}
// ... final code goes here
${FINAL}`




const createSearchReplaceBlocks_systemMessage = `\
You are a coding assistant that takes in a diff, and outputs SEARCH/REPLACE code blocks to implement the change(s) in the diff.
The diff will be labeled \`DIFF\` and the original file will be labeled \`ORIGINAL_FILE\`.

Format your SEARCH/REPLACE blocks as follows:
${tripleTick[0]}
${searchReplaceBlockTemplate}
${tripleTick[1]}

1. Your SEARCH/REPLACE block(s) must implement the diff EXACTLY. Do NOT leave anything out.

2. You are allowed to output multiple SEARCH/REPLACE blocks to implement the change.

3. Assume any comments in the diff are PART OF THE CHANGE. Include them in the output.

4. Your output should consist ONLY of SEARCH/REPLACE blocks. Do NOT output any text or explanations before or after this.

5. The ORIGINAL code in each SEARCH/REPLACE block must EXACTLY match lines in the original file. Do not add or remove any whitespace, comments, or modifications from the original code.

6. Each ORIGINAL text must be large enough to uniquely identify the change in the file. However, bias towards writing as little as possible.

7. Each ORIGINAL text must be DISJOINT from all other ORIGINAL text.

## EXAMPLE 1
DIFF
${tripleTick[0]}
// ... existing code
let x = 6.5
// ... existing code
${tripleTick[1]}

ORIGINAL_FILE
${tripleTick[0]}
let w = 5
let x = 6
let y = 7
let z = 8
${tripleTick[1]}

ACCEPTED OUTPUT
${tripleTick[0]}
${ORIGINAL}
let x = 6
${DIVIDER}
let x = 6.5
${FINAL}
${tripleTick[1]}`


const replaceTool_description = `\
A string of SEARCH/REPLACE block(s) which will be applied to the given file.
Your SEARCH/REPLACE blocks string must be formatted as follows:
${searchReplaceBlockTemplate}

## Guidelines:

1. You may output multiple search replace blocks if needed.

2. The ORIGINAL code in each SEARCH/REPLACE block must EXACTLY match lines in the original file. Do not add or remove any whitespace or comments from the original code.

3. Each ORIGINAL text must be large enough to uniquely identify the change. However, bias towards writing as little as possible.

4. Each ORIGINAL text must be DISJOINT from all other ORIGINAL text.

5. This field is a STRING (not an array).`


// ======================================================== tools ========================================================


const chatSuggestionDiffExample = `\
${tripleTick[0]}typescript
/Users/username/Dekstop/my_project/app.ts
// ... existing code ...
// {{change 1}}
// ... existing code ...
// {{change 2}}
// ... existing code ...
// {{change 3}}
// ... existing code ...
${tripleTick[1]}`



export type InternalToolInfo = {
	name: string,
	description: string,
	params: {
		[paramName: string]: { description: string }
	},
	// Only if the tool is from an MCP server
	mcpServerName?: string,
}



const uriParam = (object: string) => ({
	uri: { description: `The FULL path to the ${object}.` }
})

const paginationParam = {
	page_number: { description: 'Optional. The page number of the result. Default is 1.' }
} as const



const terminalDescHelper = `You can use this tool to run any command: sed, grep, etc. Do not edit any files with this tool; use edit_file instead. When working with git and other tools that open an editor (e.g. git diff), you should pipe to cat to get all results and not get stuck in vim.`

const cwdHelper = 'Optional. The directory in which to run the command. Defaults to the first workspace folder.'

export type SnakeCase<S extends string> =
	// exact acronym URI
	S extends 'URI' ? 'uri'
	// suffix URI: e.g. 'rootURI' -> snakeCase('root') + '_uri'
	: S extends `${infer Prefix}URI` ? `${SnakeCase<Prefix>}_uri`
	// default: for each char, prefix '_' on uppercase letters
	: S extends `${infer C}${infer Rest}`
	? `${C extends Lowercase<C> ? C : `_${Lowercase<C>}`}${SnakeCase<Rest>}`
	: S;

export type SnakeCaseKeys<T extends Record<string, any>> = {
	[K in keyof T as SnakeCase<Extract<K, string>>]: T[K]
};



export const builtinTools: {
	[T in keyof BuiltinToolCallParams]: {
		name: string;
		description: string;
		// more params can be generated than exist here, but these params must be a subset of them
		params: Partial<{ [paramName in keyof SnakeCaseKeys<BuiltinToolCallParams[T]>]: { description: string } }>
	}
} = {
	// --- context-gathering (read/search/list) ---

	read_file: {
		name: 'read_file',
		description: `Read the full contents of a file. If the path does not exist, an error is returned. Call this tool in parallel when reading multiple files simultaneously. Avoid tiny repeated slices — read a larger window if you need more context. Use search_for_files or search_pathnames_only to find the correct path if unsure. Use page_number to read later sections of large files.`,
		params: {
			...uriParam('file'),
			start_line: { description: 'Optional. Do NOT fill this field in unless you were specifically given exact line numbers to search. Defaults to the beginning of the file.' },
			end_line: { description: 'Optional. Do NOT fill this field in unless you were specifically given exact line numbers to search. Defaults to the end of the file.' },
			...paginationParam,
		},
	},

	ls_dir: {
		name: 'ls_dir',
		description: `Lists all files and folders in the given URI.`,
		params: {
			uri: { description: `Optional. The FULL path to the ${'folder'}. Leave this as empty or "" to search all folders.` },
			...paginationParam,
		},
	},

	get_dir_tree: {
		name: 'get_dir_tree',
		description: `This is a very effective way to learn about the user's codebase. Returns a tree diagram of all the files and folders in the given folder. `,
		params: {
			...uriParam('folder')
		}
	},

	// pathname_search: {
	// 	name: 'pathname_search',
	// 	description: `Returns all pathnames that match a given \`find\`-style query over the entire workspace. ONLY searches file names. ONLY searches the current workspace. You should use this when looking for a file with a specific name or path. ${paginationHelper.desc}`,

	search_pathnames_only: {
		name: 'search_pathnames_only',
		description: `Returns all pathnames that match a given query (searches ONLY file names). You should use this when looking for a file with a specific name or path.`,
		params: {
			query: { description: `Your query for the search.` },
			include_pattern: { description: 'Optional. Only fill this in if you need to limit your search because there were too many results.' },
			...paginationParam,
		},
	},



	search_for_files: {
		name: 'search_for_files',
		description: `Fast content search — returns file names whose content matches the given query (substring or regex). Use this to find files containing specific patterns or function names. Supports full regex syntax (e.g. "log.*Error", "function\\s+\\w+"). Returns file paths sorted by relevance. When doing a deep multi-step search, run multiple searches in sequence. Prefer this over run_command with grep.`,
		params: {
			query: { description: `Your query for the search.` },
			search_in_folder: { description: 'Optional. Leave as blank by default. ONLY fill this in if your previous search with the same query was truncated. Searches descendants of this folder only.' },
			is_regex: { description: 'Optional. Default is false. Whether the query is a regex.' },
			...paginationParam,
		},
	},

	// add new search_in_file tool
	search_in_file: {
		name: 'search_in_file',
		description: `Returns an array of all the start line numbers where the content appears in the file.`,
		params: {
			...uriParam('file'),
			query: { description: 'The string or regex to search for in the file.' },
			is_regex: { description: 'Optional. Default is false. Whether the query is a regex.' }
		}
	},

	read_lint_errors: {
		name: 'read_lint_errors',
		description: `Use this tool to view all the lint errors on a file.`,
		params: {
			...uriParam('file'),
		},
	},

	// --- editing (create/delete) ---

	create_file_or_folder: {
		name: 'create_file_or_folder',
		description: `Create a file or folder at the given path. To create a folder, the path MUST end with a trailing slash.`,
		params: {
			...uriParam('file or folder'),
		},
	},

	delete_file_or_folder: {
		name: 'delete_file_or_folder',
		description: `Delete a file or folder at the given path.`,
		params: {
			...uriParam('file or folder'),
			is_recursive: { description: 'Optional. Return true to delete recursively.' }
		},
	},

	edit_file: {
		name: 'edit_file',
		description: `Edit the contents of a file using exact SEARCH/REPLACE blocks. You MUST use read_file at least once before editing a file — never edit a file you haven't read. ALWAYS prefer editing existing files over creating new ones. The ORIGINAL text in each block must EXACTLY match lines in the file (same whitespace, indentation, comments). If oldString is not found exactly, the edit will fail. Provide enough surrounding context in ORIGINAL to uniquely identify the location. Each ORIGINAL block must be disjoint from all others.`,
		params: {
			...uriParam('file'),
			search_replace_blocks: { description: replaceTool_description }
		},
	},

	rewrite_file: {
		name: 'rewrite_file',
		description: `Edits a file, deleting all the old contents and replacing them with your new contents. Use this tool if you want to edit a file you just created.`,
		params: {
			...uriParam('file'),
			new_content: { description: `The new contents of the file. Must be a string.` }
		},
	},
	run_command: {
		name: 'run_command',
		description: `Runs a terminal command and waits for the result (times out after ${MAX_TERMINAL_INACTIVE_TIME}s of inactivity). ${terminalDescHelper}`,
		params: {
			command: { description: 'The terminal command to run.' },
			cwd: { description: cwdHelper },
		},
	},

	run_persistent_command: {
		name: 'run_persistent_command',
		description: `Runs a terminal command in the persistent terminal that you created with open_persistent_terminal (results after ${MAX_TERMINAL_BG_COMMAND_TIME} are returned, and command continues running in background). ${terminalDescHelper}`,
		params: {
			command: { description: 'The terminal command to run.' },
			persistent_terminal_id: { description: 'The ID of the terminal created using open_persistent_terminal.' },
		},
	},



	open_persistent_terminal: {
		name: 'open_persistent_terminal',
		description: `Use this tool when you want to run a terminal command indefinitely, like a dev server (eg \`npm run dev\`), a background listener, etc. Opens a new terminal in the user's environment which will not awaited for or killed.`,
		params: {
			cwd: { description: cwdHelper },
		}
	},


	kill_persistent_terminal: {
		name: 'kill_persistent_terminal',
		description: `Interrupts and closes a persistent terminal that you opened with open_persistent_terminal.`,
		params: { persistent_terminal_id: { description: `The ID of the persistent terminal.` } }
	},

	todo_write: {
		name: 'todo_write',
		description: `Create and maintain a structured task list for the current coding session. Tracks progress, organizes multi-step work, and surfaces status to the user.

## When to use
Use proactively when:
- The task requires 3+ distinct steps or actions
- The work is non-trivial and benefits from planning
- The user provides multiple tasks or explicitly asks for a todo list
- New instructions arrive — capture them as todos
- You start a task — mark it \`in_progress\` (only one at a time) before working
- You finish a task — mark it \`completed\` and add any follow-ups discovered

## When NOT to use
Skip when:
- The work is a single, straightforward task (or <3 trivial steps)
- The request is purely informational or conversational

## States
- \`pending\` — not started
- \`in_progress\` — actively working (exactly ONE at a time)
- \`completed\` — finished successfully
- \`cancelled\` — no longer needed

## Rules
- Update status in real time; don't batch completions
- Mark \`completed\` only after the required work is actually done, never based on intent
- Keep exactly one \`in_progress\` while work remains
- Items should be specific and actionable; break large work into smaller steps
- ALWAYS pass the full updated list every time — this replaces the entire previous list`,
		params: {
			todos: { description: `The complete updated todo list. Each item has: content (brief description), status (pending | in_progress | completed | cancelled), priority (high | medium | low). ALWAYS pass the full list — this replaces the previous list entirely.` }
		}
	},

	load_skill: {
		name: 'load_skill',
		description: `Load a specialized skill when the task at hand matches one of the available skills listed in the system prompt.

Use this tool to inject the skill's instructions and workflow guidance into the current conversation. The skill content may include detailed steps, reference scripts, and best practices for the specific task type.

The skill name must exactly match one of the skills listed in the "Available Skills" section of your system prompt. If no skill matches the current task, do not use this tool.`,
		params: {
			skill_name: { description: `The exact name of the skill to load, as listed in the "Available Skills" section of the system prompt.` }
		}
	},

	task: {
		name: 'task',
		description: `Launch a sub-agent to handle a complex, focused subtask autonomously and return the result.

## When to use
- The task is well-defined and can be delegated with a clear prompt
- The work is independent of your current line of work (e.g., exploring a part of the codebase while you plan edits to another)
- You need to gather information from a large area of the codebase without blocking your main work
- The subtask benefits from a fresh context (e.g., a specialized research pass)

## When NOT to use
- Reading a specific known file — use read_file directly
- Searching for a specific pattern — use search_for_files directly
- Simple, single-step tasks — just do them yourself

## Usage rules
1. Launch multiple sub-agents concurrently when tasks are independent — output multiple task tool calls in a single message
2. Write a highly detailed prompt so the sub-agent can work autonomously; it has no knowledge of your current context
3. Specify exactly what information the sub-agent should return in its final message
4. Tell the sub-agent whether to do research only or to also write code
5. Provide relevant file paths, function names, or patterns the sub-agent should focus on
6. To resume a previous sub-agent session, pass its task_id — it will continue with full prior context
7. The sub-agent result is NOT shown to the user automatically — summarize key findings yourself

## Available sub-agent types
- \`general\` — full tool access, for implementation and multi-step coding tasks
- \`researcher\` — read-only tools, for codebase exploration and information gathering`,
		params: {
			description: { description: `A short 3-5 word label for this task (shown in the UI while it runs, e.g. "Find auth middleware")` },
			prompt: { description: `Detailed instructions for the sub-agent. Include: what to do, what files/patterns are relevant, what to return, and how to verify the work. Be thorough — the sub-agent starts with no context.` },
			subagent_type: { description: `The type of sub-agent: "general" (full tools, can write code) or "researcher" (read-only, for exploration)` },
			task_id: { description: `Optional. Pass a prior task_id to resume that sub-agent session with its full history. Omit to start a fresh sub-agent.` },
			background: { description: `If true, launches the sub-agent asynchronously and returns immediately. You will be notified when it finishes. Use background only for independent work that can run while you continue elsewhere. Foreground (default) is better when you need the result before continuing.` },
		}
	},

	// go_to_definition
	// go_to_usages

} satisfies { [T in keyof BuiltinToolResultType]: InternalToolInfo }




export const builtinToolNames = Object.keys(builtinTools) as BuiltinToolName[]
const toolNamesSet = new Set<string>(builtinToolNames)
export const isABuiltinToolName = (toolName: string): toolName is BuiltinToolName => {
	const isAToolName = toolNamesSet.has(toolName)
	return isAToolName
}





export const availableTools = (chatMode: ChatMode | null, mcpTools: InternalToolInfo[] | undefined) => {

	const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'normal' ? undefined
		: chatMode === 'gather' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
			: chatMode === 'plan' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => {
				// Allow read/search/list tools (no approval needed)
				if (!(toolName in approvalTypeOfBuiltinToolName)) return true
				// Allow creating files for .md plans - runtime check restricts to .md only
				if (toolName === 'create_file_or_folder') return true
				if (toolName === 'rewrite_file') return true
				// Block all other editing/terminal tools
				return false
			})
				: chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
					: undefined

	const effectiveBuiltinTools = builtinToolNames?.map(toolName => builtinTools[toolName]) ?? undefined
	const effectiveMCPTools = chatMode === 'agent' ? mcpTools : undefined

	const tools: InternalToolInfo[] | undefined = !(builtinToolNames || mcpTools) ? undefined
		: [
			...effectiveBuiltinTools ?? [],
			...effectiveMCPTools ?? [],
		]

	return tools
}

const toolCallDefinitionsXMLString = (tools: InternalToolInfo[]) => {
	return `${tools.map((t, i) => {
		const params = Object.keys(t.params).map(paramName => `<${paramName}>${t.params[paramName].description}</${paramName}>`).join('\n')
		return `\
    ${i + 1}. ${t.name}
    Description: ${t.description}
    Format:
    <${t.name}>${!params ? '' : `\n${params}`}
    </${t.name}>`
	}).join('\n\n')}`
}

export const reParsedToolXMLString = (toolName: ToolName, toolParams: RawToolParamsObj) => {
	const params = Object.keys(toolParams).map(paramName => `<${paramName}>${toolParams[paramName]}</${paramName}>`).join('\n')
	return `\
    <${toolName}>${!params ? '' : `\n${params}`}
    </${toolName}>`
		.replace('\t', '  ')
}

/* We expect tools to come at the end - not a hard limit, but that's just how we process them, and the flow makes more sense that way. */
// - You are allowed to call multiple tools by specifying them consecutively. However, there should be NO text or writing between tool calls or after them.
const systemToolsXMLPrompt = (chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined) => {
	const tools = availableTools(chatMode, mcpTools)
	if (!tools || tools.length === 0) return null

	const toolXMLDefinitions = (`\
    Available tools:

    ${toolCallDefinitionsXMLString(tools)}`)

	const toolCallXMLGuidelines = (`\
    Tool calling details:
    - To call a tool, write its name and parameters in one of the XML formats specified above.
    - After you write the tool call, you must STOP and WAIT for the result.
    - All parameters are REQUIRED unless noted otherwise.
    - You are only allowed to output ONE tool call, and it must be at the END of your response.
    - Your tool call will be executed immediately, and the results will appear in the following user message.`)

	return `\
    ${toolXMLDefinitions}

    ${toolCallXMLGuidelines}`
}

// ======================================================== chat (normal, gather, agent) ========================================================


export const chat_systemMessage = ({ workspaceFolders, openedURIs, activeURI, persistentTerminalIDs, directoryStr, chatMode: mode, mcpTools, includeXMLToolDefinitions, memoryBlock, compactionSummary, availableSkills, providerName }: { workspaceFolders: string[], directoryStr: string, openedURIs: string[], activeURI: string | undefined, persistentTerminalIDs: string[], chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined, includeXMLToolDefinitions: boolean, memoryBlock?: string | null, compactionSummary?: string | null, availableSkills?: { name: string, description: string }[] | null, providerName?: ProviderName | null }) => {

	// ─── PER-MODEL PROMPT — full coverage for all Loophole providers ────────────
	const perModelPrompt = (() => {
		if (mode !== 'agent') return null
		if (!providerName) return prompt_default
		switch (providerName) {
			// Cloud frontier models
			case 'anthropic':        return prompt_anthropic
			case 'openAI':           return prompt_gpt
			case 'gemini':           return prompt_gemini
			case 'deepseek':         return prompt_deepseek
			case 'xAI':              return prompt_xai
			case 'mistral':          return prompt_mistral
			case 'groq':             return prompt_groq
			case 'cohere':           return prompt_cohere
			case 'perplexity':       return prompt_perplexity
			case 'togetherAI':       return prompt_togetherai
			case 'fireworksAI':      return prompt_fireworksai
			case 'openRouter':       return prompt_openrouter
			// Cloud-hosted known models
			case 'googleVertex':     return prompt_googlevertex    // hosts Gemini
			case 'microsoftAzure':   return prompt_microsoftazure  // hosts GPT
			case 'awsBedrock':       return prompt_awsbedrock      // typically Claude
			// Local / self-hosted
			case 'ollama':           return prompt_ollama
			case 'vLLM':             return prompt_vllm
			case 'lmStudio':         return prompt_lmstudio
			case 'liteLLM':          return prompt_litellm
			case 'openAICompatible': return prompt_openai_compatible
			default:                 return prompt_default
		}
	})()

	// ─── PERSONALITY & TONE ──────────────────────────────────────────────────────
	const personality = `# Personality and tone
- Your goal is to accomplish the user's task, NOT engage in back-and-forth conversation.
- Be concise, direct, and to the point. Do NOT add unnecessary preamble or postamble. After completing work, just stop — do not summarize what you did.
- You are STRICTLY FORBIDDEN from starting responses with "Great", "Certainly", "Okay", "Sure", "Absolutely", "Of course", or "Got it". Be direct and technical, not conversational.
- NEVER end your response with a question or offer for further assistance. Make your result final.
- Only use emojis if the user explicitly requests it.
- Do not use tools like terminal commands or code comments as a way to communicate with the user — output all communication directly in your response text.
- If you cannot or will not help with something, do not explain why or what it could lead to. Offer alternatives if possible, and keep it to 1-2 sentences.
- When referencing specific functions or pieces of code, include the pattern \`file_path:line_number\` so the user can navigate directly to the source.`

	// ─── PROFESSIONAL OBJECTIVITY ─────────────────────────────────────────────────
	const objectivity = `# Professional objectivity
Prioritize technical accuracy and truthfulness over validating the user's beliefs. Focus on facts and problem-solving, providing direct, objective technical guidance without unnecessary superlatives, praise, or emotional validation. Honestly apply rigorous standards to all ideas and disagree when necessary — even if it may not be what the user wants to hear. Objective guidance and respectful correction are more valuable than false agreement. Whenever there is uncertainty, investigate to find the truth first rather than instinctively confirming the user's beliefs.`

	// ─── CODE CONVENTIONS ─────────────────────────────────────────────────────────
	const codeConventions = `# Code conventions
- When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.
- NEVER assume that a given library is available, even if it is well known. Before writing code that uses a library or framework, check that the codebase already uses it (e.g. check package.json, neighboring files, imports).
- When you create a new component or module, first look at existing ones to understand framework choice, naming conventions, typing, and patterns.
- When editing code, first look at the surrounding context and imports to understand the choice of frameworks and libraries. Then make the change in the most idiomatic way.
- DO NOT ADD COMMENTS to code unless the user explicitly asks for them.
- Always follow security best practices. Never introduce code that exposes or logs secrets and keys. Never commit secrets or keys.
- ALWAYS prefer editing existing files over creating new ones. NEVER proactively create documentation or README files unless explicitly asked.
- NEVER commit changes unless the user explicitly asks you to.`

	// ─── TASK MANAGEMENT (TODOS) ──────────────────────────────────────────────────
	const taskManagement = mode === 'agent' ? `# Task management
You have access to the todo_write tool to help you manage and plan tasks. Use it VERY frequently to give the user visibility into your progress. It is EXTREMELY helpful for planning and breaking down larger complex tasks into smaller steps. If you do not use this tool when planning, you may forget to do important tasks — that is unacceptable.

Mark todos as completed as soon as you are done with a task. Do not batch up multiple tasks before marking them as completed.

<example>
user: Run the build and fix any type errors
assistant: I'll use todo_write to plan:
- Run the build
- Fix any type errors

Running the build now...

Found 10 type errors. Adding them to the todo list and marking the first as in_progress.

Fixed the first error. Marking as completed, moving to the next...
</example>

<example>
user: Help me write a feature for usage metrics export
assistant: I'll plan this with todo_write:
1. Research existing metrics tracking in the codebase
2. Design the metrics collection system
3. Implement core metrics tracking
4. Create export functionality for different formats

Starting with research — marking item 1 as in_progress...
[continues step by step, marking todos as completed as they go]
</example>` : ''

	// ─── DOING TASKS ──────────────────────────────────────────────────────────────
	const doingTasks = mode === 'agent' ? `# Doing tasks
For software engineering tasks (bugs, new features, refactoring, explaining code):

1. **Plan first** — Use todo_write to break down non-trivial tasks before starting
2. **Understand before editing** — Use search tools to read relevant files, types, and functions. Do NOT immediately make a change without ALL relevant context. Have maximal certainty before you edit.
3. **Implement** — Use the available tools to make changes. ALWAYS use tools to take actions — never just describe what you would do.
4. **Verify** — Run lint and typecheck commands if available (e.g. npm run lint, npm run typecheck, ruff). NEVER assume a specific test framework — check README or the codebase first.
5. **Keep going** — Prioritize taking as many steps as needed to fully complete the task. Do NOT stop early.

NEVER modify a file outside the user's workspace without explicit permission.
NEVER commit changes unless explicitly asked.` : ''

	// ─── PROACTIVENESS ───────────────────────────────────────────────────────────
	const proactiveness = mode !== 'agent' ? `# Proactiveness
You are allowed to be proactive, but only when the user asks you to do something. Strike a balance between doing the right thing and not surprising the user with unrequested actions. If the user asks how to approach something, answer their question first — do not immediately jump into taking actions.` : ''

	// ─── TOOL USAGE POLICY ───────────────────────────────────────────────────────
	let toolPolicy = ''
	if (mode === 'agent') {
		toolPolicy = `# Tool usage policy
- Only call tools if they help accomplish the user's goal. If the user says hi or asks something you can answer without tools, do NOT use tools.
- ALWAYS use dedicated file tools for file operations (read_file, edit_file, rewrite_file) — do NOT use run_command with cat/sed/awk for file work. Reserve terminal tools for actual shell operations like git, npm, docker, etc.
- When running a non-trivial terminal command, briefly explain what it does and why.
- **Parallel reads**: If you need to read multiple independent files or run multiple independent searches, you MAY output multiple tool calls in a single response. Only parallelize when there are NO dependencies between the calls. Do NOT parallelize writes, edits, or terminal commands.
- When doing open-ended codebase exploration, search extensively using search_for_files, search_pathnames_only, and read_file in sequence or parallel before making edits.
- Git: Only commit, amend, push, or create PRs when explicitly requested. Before committing, inspect git status and git diff; stage only intended files; never commit secrets; write a concise commit message matching the repo style.
- If you think you should use tools, you do not need to ask for permission.
- Many tools only work if the user has a workspace open.`
	} else if (mode === 'gather') {
		toolPolicy = `# Tool usage policy
- You MUST use tools to gather information, files, and context. Read extensively.
- Only call tools if they help accomplish the goal.
- Only use ONE tool call at a time.
- STRICT RULE: You are READ-ONLY. You MUST NOT call create_file_or_folder, edit_file, rewrite_file, delete_file_or_folder, run_command, run_persistent_command, open_persistent_terminal, or kill_persistent_terminal.`
	} else if (mode === 'plan') {
		toolPolicy = `# Tool usage policy
- Read files and search the codebase to understand the project before writing a plan.
- Only use ONE tool call at a time.
- STRICT RULE: When calling create_file_or_folder, the uri MUST end with ".md". No .ts, .js, .py, .json, .css, .html files allowed.
- STRICT RULE: rewrite_file is ONLY allowed on .md files you just created.
- STRICT RULE: You MUST NOT call edit_file, delete_file_or_folder, run_command, run_persistent_command, open_persistent_terminal, or kill_persistent_terminal.
- To show code changes, write them as code blocks in your response instead of editing files.
- Your plan should include: what changes and why, specific files to modify, step-by-step approach, and how to verify the changes work.`
	} else {
		toolPolicy = `# Mode
You are in Chat mode. You have NO tools available. You cannot read files, search the codebase, edit files, or run commands. You can ONLY have a conversation.
- Ask the user to paste file contents directly if you need context. Tell them to type @ to reference files.
- If the user wants you to explore their codebase or make changes, tell them to switch to Gather, Plan, or Agent mode.`
	}

	// ─── CODE BLOCK FORMAT ───────────────────────────────────────────────────────
	const codeBlockFormat = `# Code block format
When writing code blocks (wrapped in triple backticks):
- Include a language identifier where possible. Terminal commands should use the language 'shell'.
- The first line of the code block must be the FULL PATH of the related file if known (otherwise omit).
- The remaining contents proceed as usual.`

	const suggestionFormat = (mode === 'gather' || mode === 'normal') ? `
When suggesting an edit to a file, describe it in a CODE BLOCK:
- First line = full file path (if known)
- Use comments like "// ... existing code ..." to condense — NEVER write the whole file
- Your description is the only context given to another LLM to apply the edit, so be accurate and complete

Example:
${chatSuggestionDiffExample}` : ''

	// ─── CODE REFERENCES ──────────────────────────────────────────────────────────
	const codeReferences = `# Code references
When referencing specific functions or code, include \`file_path:line_number\` to let the user navigate directly.

<example>
user: Where are errors from the client handled?
assistant: Clients are marked as failed in the \`connectToServer\` function in src/services/process.ts:712.
</example>`

	// ─── SYSTEM INFO ─────────────────────────────────────────────────────────────
	const sysInfo = `Here is the user's system information:
<system_info>
- ${os}

- Workspace folders:
${workspaceFolders.join('\n') || 'NO FOLDERS OPEN'}

- Active file:
${activeURI ?? 'none'}

- Open files:
${openedURIs.join('\n') || 'NO OPENED FILES'}${mode === 'agent' && persistentTerminalIDs.length !== 0 ? `

- Persistent terminal IDs available: ${persistentTerminalIDs.join(', ')}` : ''}
</system_info>`

	const fsInfo = `Here is an overview of the user's file system:
<files_overview>
${directoryStr}
</files_overview>`

	const toolDefinitions = includeXMLToolDefinitions ? systemToolsXMLPrompt(mode, mcpTools) : null

	// ─── ASSEMBLE ────────────────────────────────────────────────────────────────
	// ─── SKILLS ───────────────────────────────────────────────────────────────────
	const skillsSection = (mode === 'agent' && availableSkills?.length)
		? `# Available Skills\nThe following skills are available via the load_skill tool. Use load_skill when your task matches a skill's description:\n\n${availableSkills.map(s => `- **${s.name}**: ${s.description}`).join('\n')}`
		: null

	// Plan mode reminder (Kilo injects this for Anthropic in plan mode)
	const planModePrompt = (mode === 'plan' && providerName === 'anthropic') ? prompt_plan_reminder_anthropic : (mode === 'plan' ? prompt_plan_mode : null)

	const sections = [
		perModelPrompt,
		personality,
		objectivity,
		codeConventions,
		taskManagement,
		doingTasks,
		proactiveness,
		toolPolicy,
		codeBlockFormat + suggestionFormat,
		codeReferences,
		`Today's date is ${new Date().toDateString()}.`,
		skillsSection,
		memoryBlock ?? null,
		compactionSummary ?? null,
		planModePrompt,
		sysInfo,
		toolDefinitions,
		fsInfo,
	].filter(Boolean) as string[]

	return sections.join('\n\n').trim().replace('\t', '  ')

}


export const DEFAULT_FILE_SIZE_LIMIT = 2_000_000

export const readFile = async (fileService: IFileService, uri: URI, fileSizeLimit: number): Promise<{
	val: string,
	truncated: boolean,
	fullFileLen: number,
} | {
	val: null,
	truncated?: undefined
	fullFileLen?: undefined,
}> => {
	try {
		const fileContent = await fileService.readFile(uri)
		const val = fileContent.value.toString()
		if (val.length > fileSizeLimit) return { val: val.substring(0, fileSizeLimit), truncated: true, fullFileLen: val.length }
		return { val, truncated: false, fullFileLen: val.length }
	}
	catch (e) {
		return { val: null }
	}
}





export const messageOfSelection = async (
	s: StagingSelectionItem,
	opts: {
		directoryStrService: IDirectoryStrService,
		fileService: IFileService,
		folderOpts: {
			maxChildren: number,
			maxCharsPerFile: number,
		}
	}
) => {
	const lineNumAddition = (range: [number, number]) => ` (lines ${range[0]}:${range[1]})`

	if (s.type === 'CodeSelection') {
		const { val } = await readFile(opts.fileService, s.uri, DEFAULT_FILE_SIZE_LIMIT)
		const lines = val?.split('\n')

		const innerVal = lines?.slice(s.range[0] - 1, s.range[1]).join('\n')
		const content = !lines ? ''
			: `${tripleTick[0]}${s.language}\n${innerVal}\n${tripleTick[1]}`
		const str = `${s.uri.fsPath}${lineNumAddition(s.range)}:\n${content}`
		return str
	}
	else if (s.type === 'File') {
		const { val } = await readFile(opts.fileService, s.uri, DEFAULT_FILE_SIZE_LIMIT)

		const innerVal = val
		const content = val === null ? ''
			: `${tripleTick[0]}${s.language}\n${innerVal}\n${tripleTick[1]}`

		const str = `${s.uri.fsPath}:\n${content}`
		return str
	}
	else if (s.type === 'Folder') {
		const dirStr: string = await opts.directoryStrService.getDirectoryStrTool(s.uri)
		const folderStructure = `${s.uri.fsPath} folder structure:${tripleTick[0]}\n${dirStr}\n${tripleTick[1]}`

		const uris = await opts.directoryStrService.getAllURIsInDirectory(s.uri, { maxResults: opts.folderOpts.maxChildren })
		const strOfFiles = await Promise.all(uris.map(async uri => {
			const { val, truncated } = await readFile(opts.fileService, uri, opts.folderOpts.maxCharsPerFile)
			const truncationStr = truncated ? `\n... file truncated ...` : ''
			const content = val === null ? 'null' : `${tripleTick[0]}\n${val}${truncationStr}\n${tripleTick[1]}`
			const str = `${uri.fsPath}:\n${content}`
			return str
		}))
		const contentStr = [folderStructure, ...strOfFiles].join('\n\n')
		return contentStr
	}
	else
		return ''

}


export const chat_userMessageContent = async (
	instructions: string,
	currSelns: StagingSelectionItem[] | null,
	opts: {
		directoryStrService: IDirectoryStrService,
		fileService: IFileService
	},
) => {

	const selnsStrs = await Promise.all(
		(currSelns ?? []).map(async (s) =>
			messageOfSelection(s, {
				...opts,
				folderOpts: { maxChildren: 100, maxCharsPerFile: 100_000, }
			})
		)
	)


	let str = ''
	str += `${instructions}`

	const selnsStr = selnsStrs.join('\n\n') ?? ''
	if (selnsStr) str += `\n---\nSELECTIONS\n${selnsStr}`
	return str;
}


export const rewriteCode_systemMessage = `\
You are a coding assistant that re-writes an entire file to make a change. You are given the original file \`ORIGINAL_FILE\` and a change \`CHANGE\`.

Directions:
1. Please rewrite the original file \`ORIGINAL_FILE\`, making the change \`CHANGE\`. You must completely re-write the whole file.
2. Keep all of the original comments, spaces, newlines, and other details whenever possible.
3. ONLY output the full new file. Do not add any other explanations or text.
`



// ======================================================== apply (writeover) ========================================================

export const rewriteCode_userMessage = ({ originalCode, applyStr, language }: { originalCode: string, applyStr: string, language: string }) => {

	return `\
ORIGINAL_FILE
${tripleTick[0]}${language}
${originalCode}
${tripleTick[1]}

CHANGE
${tripleTick[0]}
${applyStr}
${tripleTick[1]}

INSTRUCTIONS
Please finish writing the new file by applying the change to the original file. Return ONLY the completion of the file, without any explanation.
`
}



// ======================================================== apply (fast apply - search/replace) ========================================================

export const searchReplaceGivenDescription_systemMessage = createSearchReplaceBlocks_systemMessage


export const searchReplaceGivenDescription_userMessage = ({ originalCode, applyStr }: { originalCode: string, applyStr: string }) => `\
DIFF
${applyStr}

ORIGINAL_FILE
${tripleTick[0]}
${originalCode}
${tripleTick[1]}`





export const loopholePrefixAndSuffix = ({ fullFileStr, startLine, endLine }: { fullFileStr: string, startLine: number, endLine: number }) => {

	const fullFileLines = fullFileStr.split('\n')

	/*

	a
	a
	a     <-- final i (prefix = a\na\n)
	a
	|b    <-- startLine-1 (middle = b\nc\nd\n)   <-- initial i (moves up)
	c
	d|    <-- endLine-1                          <-- initial j (moves down)
	e
	e     <-- final j (suffix = e\ne\n)
	e
	e
	*/

	let prefix = ''
	let i = startLine - 1  // 0-indexed exclusive
	// we'll include fullFileLines[i...(startLine-1)-1].join('\n') in the prefix.
	while (i !== 0) {
		const newLine = fullFileLines[i - 1]
		if (newLine.length + 1 + prefix.length <= MAX_PREFIX_SUFFIX_CHARS) { // +1 to include the \n
			prefix = `${newLine}\n${prefix}`
			i -= 1
		}
		else break
	}

	let suffix = ''
	let j = endLine - 1
	while (j !== fullFileLines.length - 1) {
		const newLine = fullFileLines[j + 1]
		if (newLine.length + 1 + suffix.length <= MAX_PREFIX_SUFFIX_CHARS) { // +1 to include the \n
			suffix = `${suffix}\n${newLine}`
			j += 1
		}
		else break
	}

	return { prefix, suffix }

}


// ======================================================== quick edit (ctrl+K) ========================================================

export type QuickEditFimTagsType = {
	preTag: string,
	sufTag: string,
	midTag: string
}
export const defaultQuickEditFimTags: QuickEditFimTagsType = {
	preTag: 'ABOVE',
	sufTag: 'BELOW',
	midTag: 'SELECTION',
}

// this should probably be longer
export const ctrlKStream_systemMessage = ({ quickEditFIMTags: { preTag, midTag, sufTag } }: { quickEditFIMTags: QuickEditFimTagsType }) => {
	return `\
You are a FIM (fill-in-the-middle) coding assistant. Your task is to fill in the middle SELECTION marked by <${midTag}> tags.

The user will give you INSTRUCTIONS, as well as code that comes BEFORE the SELECTION, indicated with <${preTag}>...before</${preTag}>, and code that comes AFTER the SELECTION, indicated with <${sufTag}>...after</${sufTag}>.
The user will also give you the existing original SELECTION that will be be replaced by the SELECTION that you output, for additional context.

Instructions:
1. Your OUTPUT should be a SINGLE PIECE OF CODE of the form <${midTag}>...new_code</${midTag}>. Do NOT output any text or explanations before or after this.
2. You may ONLY CHANGE the original SELECTION, and NOT the content in the <${preTag}>...</${preTag}> or <${sufTag}>...</${sufTag}> tags.
3. Make sure all brackets in the new selection are balanced the same as in the original selection.
4. Be careful not to duplicate or remove variables, comments, or other syntax by mistake.
`
}

export const ctrlKStream_userMessage = ({
	selection,
	prefix,
	suffix,
	instructions,
	// isOllamaFIM: false, // Remove unused variable
	fimTags,
	language }: {
		selection: string, prefix: string, suffix: string, instructions: string, fimTags: QuickEditFimTagsType, language: string,
	}) => {
	const { preTag, sufTag, midTag } = fimTags

	// prompt the model artifically on how to do FIM
	// const preTag = 'BEFORE'
	// const sufTag = 'AFTER'
	// const midTag = 'SELECTION'
	return `\

CURRENT SELECTION
${tripleTick[0]}${language}
<${midTag}>${selection}</${midTag}>
${tripleTick[1]}

INSTRUCTIONS
${instructions}

<${preTag}>${prefix}</${preTag}>
<${sufTag}>${suffix}</${sufTag}>

Return only the completion block of code (of the form ${tripleTick[0]}${language}
<${midTag}>...new code</${midTag}>
${tripleTick[1]}).`
};







/*
// ======================================================== ai search/replace ========================================================


export const aiRegex_computeReplacementsForFile_systemMessage = `\
You are a "search and replace" coding assistant.

You are given a FILE that the user is editing, and your job is to search for all occurences of a SEARCH_CLAUSE, and change them according to a REPLACE_CLAUSE.

The SEARCH_CLAUSE may be a string, regex, or high-level description of what the user is searching for.

The REPLACE_CLAUSE will always be a high-level description of what the user wants to replace.

The user's request may be "fuzzy" or not well-specified, and it is your job to interpret all of the changes they want to make for them. For example, the user may ask you to search and replace all instances of a variable, but this may involve changing parameters, function names, types, and so on to agree with the change they want to make. Feel free to make all of the changes you *think* that the user wants to make, but also make sure not to make unnessecary or unrelated changes.

## Instructions

1. If you do not want to make any changes, you should respond with the word "no".

2. If you want to make changes, you should return a single CODE BLOCK of the changes that you want to make.
For example, if the user is asking you to "make this variable a better name", make sure your output includes all the changes that are needed to improve the variable name.
- Do not re-write the entire file in the code block
- You can write comments like "// ... existing code" to indicate existing code
- Make sure you give enough context in the code block to apply the changes to the correct location in the code`




// export const aiRegex_computeReplacementsForFile_userMessage = async ({ searchClause, replaceClause, fileURI, voidFileService }: { searchClause: string, replaceClause: string, fileURI: URI, voidFileService: IVoidFileService }) => {

// 	// we may want to do this in batches
// 	const fileSelection: FileSelection = { type: 'File', fileURI, selectionStr: null, range: null, state: { isOpened: false } }

// 	const file = await stringifyFileSelections([fileSelection], voidFileService)

// 	return `\
// ## FILE
// ${file}

// ## SEARCH_CLAUSE
// Here is what the user is searching for:
// ${searchClause}

// ## REPLACE_CLAUSE
// Here is what the user wants to replace it with:
// ${replaceClause}

// ## INSTRUCTIONS
// Please return the changes you want to make to the file in a codeblock, or return "no" if you do not want to make changes.`
// }




// // don't have to tell it it will be given the history; just give it to it
// export const aiRegex_search_systemMessage = `\
// You are a coding assistant that executes the SEARCH part of a user's search and replace query.

// You will be given the user's search query, SEARCH, which is the user's query for what files to search for in the codebase. You may also be given the user's REPLACE query for additional context.

// Output
// - Regex query
// - Files to Include (optional)
// - Files to Exclude? (optional)

// `






// ======================================================== old examples ========================================================

Do not tell the user anything about the examples below. Do not assume the user is talking about any of the examples below.

## EXAMPLE 1
FILES
math.ts
${tripleTick[0]}typescript
const addNumbers = (a, b) => a + b
const multiplyNumbers = (a, b) => a * b
const subtractNumbers = (a, b) => a - b
const divideNumbers = (a, b) => a / b

const vectorize = (...numbers) => {
	return numbers // vector
}

const dot = (vector1: number[], vector2: number[]) => {
	if (vector1.length !== vector2.length) throw new Error(\`Could not dot vectors \${vector1} and \${vector2}. Size mismatch.\`)
	let sum = 0
	for (let i = 0; i < vector1.length; i += 1)
		sum += multiplyNumbers(vector1[i], vector2[i])
	return sum
}

const normalize = (vector: number[]) => {
	const norm = Math.sqrt(dot(vector, vector))
	for (let i = 0; i < vector.length; i += 1)
		vector[i] = divideNumbers(vector[i], norm)
	return vector
}

const normalized = (vector: number[]) => {
	const v2 = [...vector] // clone vector
	return normalize(v2)
}
${tripleTick[1]}


SELECTIONS
math.ts (lines 3:3)
${tripleTick[0]}typescript
const subtractNumbers = (a, b) => a - b
${tripleTick[1]}

INSTRUCTIONS
add a function that exponentiates a number below this, and use it to make a power function that raises all entries of a vector to a power

## ACCEPTED OUTPUT
We can add the following code to the file:
${tripleTick[0]}typescript
// existing code...
const subtractNumbers = (a, b) => a - b
const exponentiateNumbers = (a, b) => Math.pow(a, b)
const divideNumbers = (a, b) => a / b
// existing code...

const raiseAll = (vector: number[], power: number) => {
	for (let i = 0; i < vector.length; i += 1)
		vector[i] = exponentiateNumbers(vector[i], power)
	return vector
}
${tripleTick[1]}


## EXAMPLE 2
FILES
fib.ts
${tripleTick[0]}typescript

const dfs = (root) => {
	if (!root) return;
	console.log(root.val);
	dfs(root.left);
	dfs(root.right);
}
const fib = (n) => {
	if (n < 1) return 1
	return fib(n - 1) + fib(n - 2)
}
${tripleTick[1]}

SELECTIONS
fib.ts (lines 10:10)
${tripleTick[0]}typescript
	return fib(n - 1) + fib(n - 2)
${tripleTick[1]}

INSTRUCTIONS
memoize results

## ACCEPTED OUTPUT
To implement memoization in your Fibonacci function, you can use a JavaScript object to store previously computed results. This will help avoid redundant calculations and improve performance. Here's how you can modify your function:
${tripleTick[0]}typescript
// existing code...
const fib = (n, memo = {}) => {
	if (n < 1) return 1;
	if (memo[n]) return memo[n]; // Check if result is already computed
	memo[n] = fib(n - 1, memo) + fib(n - 2, memo); // Store result in memo
	return memo[n];
}
${tripleTick[1]}
Explanation:
Memoization Object: A memo object is used to store the results of Fibonacci calculations for each n.
Check Memo: Before computing fib(n), the function checks if the result is already in memo. If it is, it returns the stored result.
Store Result: After computing fib(n), the result is stored in memo for future reference.

## END EXAMPLES

*/


// ======================================================== scm ========================================================================

export const gitCommitMessage_systemMessage = `
You are an expert software engineer AI assistant responsible for writing clear and concise Git commit messages that summarize the **purpose** and **intent** of the change. Try to keep your commit messages to one sentence. If necessary, you can use two sentences.

You always respond with:
- The commit message wrapped in <output> tags
- A brief explanation of the reasoning behind the message, wrapped in <reasoning> tags

Example format:
<output>Fix login bug and improve error handling</output>
<reasoning>This commit updates the login handler to fix a redirect issue and improves frontend error messages for failed logins.</reasoning>

Do not include anything else outside of these tags.
Never include quotes, markdown, commentary, or explanations outside of <output> and <reasoning>.`.trim()


/**
 * Create a user message for the LLM to generate a commit message. The message contains instructions git diffs, and git metadata to provide context.
 *
 * @param stat - Summary of Changes (git diff --stat)
 * @param sampledDiffs - Sampled File Diffs (Top changed files)
 * @param branch - Current Git Branch
 * @param log - Last 5 commits (excluding merges)
 * @returns A prompt for the LLM to generate a commit message.
 *
 * @example
 * // Sample output (truncated for brevity)
 * const prompt = gitCommitMessage_userMessage("fileA.ts | 10 ++--", "diff --git a/fileA.ts...", "main", "abc123|Fix bug|2025-01-01\n...")
 *
 * // Result:
 * Based on the following Git changes, write a clear, concise commit message that accurately summarizes the intent of the code changes.
 *
 * Section 1 - Summary of Changes (git diff --stat):
 * fileA.ts | 10 ++--
 *
 * Section 2 - Sampled File Diffs (Top changed files):
 * diff --git a/fileA.ts b/fileA.ts
 * ...
 *
 * Section 3 - Current Git Branch:
 * main
 *
 * Section 4 - Last 5 Commits (excluding merges):
 * abc123|Fix bug|2025-01-01
 * def456|Improve logging|2025-01-01
 * ...
 */
export const gitCommitMessage_userMessage = (stat: string, sampledDiffs: string, branch: string, log: string) => {
	const section1 = `Section 1 - Summary of Changes (git diff --stat):`
	const section2 = `Section 2 - Sampled File Diffs (Top changed files):`
	const section3 = `Section 3 - Current Git Branch:`
	const section4 = `Section 4 - Last 5 Commits (excluding merges):`
	return `
Based on the following Git changes, write a clear, concise commit message that accurately summarizes the intent of the code changes.

${section1}

${stat}

${section2}

${sampledDiffs}

${section3}

${branch}

${section4}

${log}`.trim()
}
