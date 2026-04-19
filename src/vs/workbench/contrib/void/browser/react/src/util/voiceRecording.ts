/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { useState, useCallback, useRef, useEffect } from 'react';

// Web Speech API type declarations
declare global {
	interface Window {
		SpeechRecognition: any;
		webkitSpeechRecognition: any;
	}
}

interface SpeechRecognitionEvent {
	resultIndex: number;
	results: {
		isFinal: boolean;
		0: {
			transcript: string;
		};
	}[];
}

interface SpeechRecognitionErrorEvent {
	error: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceRecordingState {
	state: RecordingState;
	transcript: string;
	error: string | null;
	isSupported: boolean;
}

interface VoiceRecordingActions {
	startRecording: () => void;
	stopRecording: () => void;
	toggleRecording: () => void;
	clearTranscript: () => void;
}

export function useVoiceRecording(): VoiceRecordingState & VoiceRecordingActions {
	const [state, setState] = useState<RecordingState>('idle');
	const [transcript, setTranscript] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSupported, setIsSupported] = useState(true);

	const recognitionRef = useRef<any>(null);
	const finalTranscriptRef = useRef('');

	useEffect(() => {
		// Check if Web Speech API is supported
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			setIsSupported(false);
			setError('Speech recognition not supported in this browser');
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US';

		recognition.onstart = () => {
			setState('recording');
			setError(null);
			finalTranscriptRef.current = '';
		};

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let interimTranscript = '';
			let finalTranscript = finalTranscriptRef.current;

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					finalTranscript += transcript;
				} else {
					interimTranscript += transcript;
				}
			}

			finalTranscriptRef.current = finalTranscript;
			setTranscript(finalTranscript + interimTranscript);
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			console.error('Speech recognition error:', event.error);
			if (event.error === 'not-allowed') {
				setError('Microphone permission denied');
			} else if (event.error === 'no-speech') {
				setError('No speech detected');
			} else {
				setError(`Error: ${event.error}`);
			}
			setState('error');
		};

		recognition.onend = () => {
			setState('idle');
		};

		recognitionRef.current = recognition;

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, []);

	const startRecording = useCallback(() => {
		if (!recognitionRef.current) {
			setError('Speech recognition not available');
			return;
		}

		try {
			finalTranscriptRef.current = '';
			setTranscript('');
			setError(null);
			recognitionRef.current.start();
		} catch (err) {
			console.error('Failed to start recording:', err);
			setError('Failed to start recording');
			setState('error');
		}
	}, []);

	const stopRecording = useCallback(() => {
		if (recognitionRef.current && state === 'recording') {
			recognitionRef.current.stop();
		}
	}, [state]);

	const toggleRecording = useCallback(() => {
		if (state === 'recording') {
			stopRecording();
		} else {
			startRecording();
		}
	}, [state, startRecording, stopRecording]);

	const clearTranscript = useCallback(() => {
		setTranscript('');
		finalTranscriptRef.current = '';
	}, []);

	return {
		state,
		transcript,
		error,
		isSupported,
		startRecording,
		stopRecording,
		toggleRecording,
		clearTranscript,
	};
}
