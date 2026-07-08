'use client';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/apiClient';
import { Mic, Square } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  onError: (msg: string) => void;
}

export default function VoiceRecorder({ onTranscript, onError }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState('processing');
        stream.getTracks().forEach(track => track.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        try {
          const { data } = await api.post('/ai/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (data.transcript) {
            onTranscript(data.transcript);
          } else if (data.fallback) {
            onError(data.message || 'Whisper not installed. Please type your complaint.');
          }
        } catch (err: unknown) {
          onError(err instanceof Error ? err.message : 'Transcription failed.');
        } finally {
          setState('idle');
          setDuration(0);
        }
      };

      mediaRecorder.start();
      setState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      onError('Microphone access denied. Please allow microphone access.');
    }
  }, [onTranscript, onError]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <motion.button
        id="voice-record-btn"
        type="button"
        onClick={state === 'idle' ? startRecording : stopRecording}
        disabled={state === 'processing'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={
          state === 'recording'
            ? { boxShadow: ['0 0 0 0px rgba(255,107,107,0.4)', '0 0 0 20px rgba(255,107,107,0)'] }
            : {}
        }
        transition={state === 'recording' ? { duration: 1.5, repeat: Infinity } : {}}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all ${
          state === 'idle'
            ? 'bg-primary text-white shadow-lg hover:shadow-xl'
            : state === 'recording'
            ? 'bg-danger text-white'
            : 'bg-gray-300 text-gray-500 cursor-wait'
        }`}
        aria-label={state === 'idle' ? 'Start recording' : 'Stop recording'}
      >
        {state === 'processing' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full"
          />
        ) : state === 'recording' ? (
          <Square className="w-6 h-6 fill-white text-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </motion.button>

      {state === 'recording' && (
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-2 h-2 bg-danger rounded-full"
          />
          <span className="text-danger font-mono font-semibold">{formatDuration(duration)}</span>
          <span className="text-textsecondary text-sm">Recording... Tap to stop</span>
        </div>
      )}

      {state === 'processing' && (
        <p className="text-textsecondary text-sm animate-pulse">Processing your voice...</p>
      )}

      {state === 'idle' && duration === 0 && (
        <p className="text-textsecondary text-sm text-center">
          Tap the mic and speak your complaint in any language
        </p>
      )}
    </div>
  );
}
