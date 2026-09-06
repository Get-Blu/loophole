import { importAMDNodeModule } from '../../../../amdX.js';

type GptTokenizerModule = typeof import('gpt-tokenizer');

let countTokensFn: GptTokenizerModule['countTokens'] | undefined;
const whenLoaded = importAMDNodeModule<GptTokenizerModule>('gpt-tokenizer', 'dist/o200k_base.js')
	.then(mod => { countTokensFn = mod.countTokens })
	.catch(() => { /* keep using the fallback estimate below */ })

const FALLBACK_CHARS_PER_TOKEN = 4

export const estimateTokens = (text: string): number => {
	if (!text) return 0
	if (countTokensFn) return countTokensFn(text)
	return Math.ceil(text.length / FALLBACK_CHARS_PER_TOKEN)
}

// Exposed for callers (e.g. tests) that want the precise count and can await it.
export const whenTokenizerReady = (): Promise<void> => whenLoaded
