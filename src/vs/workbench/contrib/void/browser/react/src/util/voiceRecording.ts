/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useState, useCallback, useRef } from 'react';

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export interface VoiceRecordingCallbacks {
	onError?: (error: string) => void;
	onDownloadStart?: () => void;
	onDownloadComplete?: () => void;
}

export function useVoiceRecording(
	transcribeAudio: (params: { pcmBase64: string; sampleRate: number }) => Promise<{ text: string } | { error: string }>,
	callbacks?: VoiceRecordingCallbacks
) {
	const [state, setState] = useState<RecordingState>('idle');
	const [transcript, setTranscript] = useState('');
	const [error, setError] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

	const startRecording = useCallback(async () => {
		if (!isSupported) {
			const errorMsg = 'Microphone not available';
			setError(errorMsg);
			callbacks?.onError?.(errorMsg);
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;
			chunksRef.current = [];

			const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
			const recorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = recorder;

			recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

			recorder.onstop = async () => {
				setState('processing');
				streamRef.current?.getTracks().forEach(t => t.stop());

				const blob = new Blob(chunksRef.current, { type: mimeType });
				const arrayBuffer = await blob.arrayBuffer();

				try {
					// decode + resample to 16kHz mono — what Whisper expects
					const audioCtx = new AudioContext({ sampleRate: 16000 });
					const decoded = await audioCtx.decodeAudioData(arrayBuffer);
					const channelData = decoded.getChannelData(0); // Float32Array @ 16kHz

					// base64-encode the raw float32 bytes for IPC transport (chunked to avoid stack issues)
					const bytes = new Uint8Array(channelData.buffer);
					let binary = '';
					const chunkSize = 0x8000;
					for (let i = 0; i < bytes.length; i += chunkSize) {
						binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
					}
					const pcmBase64 = btoa(binary);

					// Notify if this might trigger a download (for local whisper)
					callbacks?.onDownloadStart?.();

					const result = await transcribeAudio({ pcmBase64, sampleRate: decoded.sampleRate });

					callbacks?.onDownloadComplete?.();

					if ('error' in result) {
						setError(result.error);
						setState('error');
						callbacks?.onError?.(result.error);
					} else {
						setTranscript(result.text);
						setState('idle');
					}
				} catch (processingErr) {
					const errorMsg = `Failed to process audio: ${processingErr}`;
					setError(errorMsg);
					setState('error');
					callbacks?.onError?.(errorMsg);
				}
			};

			recorder.start();
			setState('recording');
			setError(null);
		} catch (err) {
			console.error('Failed to start recording:', err);
			const errorMsg = 'Microphone permission denied or not available';
			setError(errorMsg);
			setState('error');
			callbacks?.onError?.(errorMsg);
		}
	}, [isSupported, transcribeAudio, callbacks]);

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current && state === 'recording') {
			mediaRecorderRef.current.stop();
		}
	}, [state]);

	const toggleRecording = useCallback(() => {
		if (state === 'recording') stopRecording();
		else startRecording();
	}, [state, startRecording, stopRecording]);

	const clearTranscript = useCallback(() => setTranscript(''), []);

	return { state, transcript, error, isSupported, startRecording, stopRecording, toggleRecording, clearTranscript };
}
