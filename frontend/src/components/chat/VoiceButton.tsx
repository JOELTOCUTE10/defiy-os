import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onTranscript }) => {
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  React.useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!supported) {
    return (
      <button
        disabled
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
        title="Speech recognition is not supported in this browser."
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      className={`p-2.5 rounded-xl transition-all ${
        listening
          ? 'bg-rose-500 text-white animate-bounce'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
      }`}
      title={listening ? 'Stop voice input' : 'Start voice input'}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
};
