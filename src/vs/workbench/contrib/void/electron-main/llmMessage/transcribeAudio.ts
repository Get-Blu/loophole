/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import OpenAI from 'openai';
import { pipeline, AutomaticSpeechRecognitionPipeline, env } from '@huggingface/transformers';
import { MainTranscribeAudioParams } from '../../common/sendLLMMessageTypes.js';
import * as os from 'os';
import * as path from 'path';

// Set cache dir to user home dir instead of node_modules (avoids EPERM on read-only installs)
env.cacheDir = path.join(os.homedir(), '.loophole', 'transformers-cache');

// ---------- local whisper (free, offline) ----------
const modelIdOfSize = {
	tiny: 'onnx-community/whisper-tiny.en',
	base: 'onnx-community/whisper-base.en',
	small: 'onnx-community/whisper-small.en',
} as const;

const transcriberPromises: Partial<Record<'tiny' | 'base' | 'small', Promise<AutomaticSpeechRecognitionPipeline>>> = {};
const getTranscriber = (size: 'tiny' | 'base' | 'small') => {
	if (!transcriberPromises[size]) {
		transcriberPromises[size] = pipeline('automatic-speech-recognition', modelIdOfSize[size], { dtype: 'fp32' }) as Promise<AutomaticSpeechRecognitionPipeline>;
	}
	return transcriberPromises[size]!;
};

const transcribeLocally = async (audioFloat32: Float32Array, sampleRate: number, size: 'tiny' | 'base' | 'small') => {
	const transcriber = await getTranscriber(size);
	const result: any = await transcriber(audioFloat32, { sampling_rate: sampleRate });
	const text = Array.isArray(result) ? result.map(r => r.text).join(' ') : result.text;
	return text?.trim() ?? '';
};

// ---------- openai whisper (paid, needs key) ----------
// wraps raw 16-bit PCM samples in a minimal WAV header — no extra encoding library needed
const wavBufferFromFloat32 = (audioFloat32: Float32Array, sampleRate: number): Buffer => {
	const numSamples = audioFloat32.length;
	const buffer = Buffer.alloc(44 + numSamples * 2);

	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + numSamples * 2, 4);
	buffer.write('WAVE', 8);
	buffer.write('fmt ', 12);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);       // PCM
	buffer.writeUInt16LE(1, 22);       // mono
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
	buffer.writeUInt16LE(2, 32);       // block align
	buffer.writeUInt16LE(16, 34);      // bits per sample
	buffer.write('data', 36);
	buffer.writeUInt32LE(numSamples * 2, 40);

	for (let i = 0; i < numSamples; i++) {
		const s = Math.max(-1, Math.min(1, audioFloat32[i]));
		buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
	}
	return buffer;
};

const transcribeWithOpenAI = async (audioFloat32: Float32Array, sampleRate: number, apiKey: string) => {
	const wavBuffer = wavBufferFromFloat32(audioFloat32, sampleRate);
	const file = await OpenAI.toFile(wavBuffer, 'recording.wav', { type: 'audio/wav' });
	const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
	const result = await openai.audio.transcriptions.create({ file, model: 'whisper-1' });
	return result.text;
};

// ---------- dispatch ----------
export const transcribeAudio = async (params: MainTranscribeAudioParams): Promise<{ text: string } | { error: string }> => {
	const { pcmBase64, sampleRate, transcriptionProvider, localWhisperModelSize, settingsOfProvider } = params;
	try {
		const bytes = Buffer.from(pcmBase64, 'base64');
		const audioFloat32 = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);

		if (transcriptionProvider === 'openai') {
			const apiKey = settingsOfProvider.openAI?.apiKey;
			if (!apiKey) return { error: 'No OpenAI API key set. Add one in Settings, or switch Voice Transcription to "Local Whisper" (free).' };
			const text = await transcribeWithOpenAI(audioFloat32, sampleRate, apiKey);
			return { text: text?.trim() ?? '' };
		} else {
			const text = await transcribeLocally(audioFloat32, sampleRate, localWhisperModelSize);
			return { text };
		}
	} catch (error) {
		return { error: error + '' };
	}
};
