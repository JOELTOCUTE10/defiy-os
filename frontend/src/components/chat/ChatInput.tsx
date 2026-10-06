import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, X } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSend: (content: string, source?: 'text' | 'voice') => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [isVoiceDraft, setIsVoiceDraft] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { supported, listening, transcript, start, stop, reset } = useSpeechRecognition();

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  // Sync speech transcript into input field
  useEffect(() => {
    if (transcript) {
      setText(transcript);
      setIsVoiceDraft(true);
    }
  }, [transcript]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (listening) {
      stop();
    }

    onSend(trimmed, isVoiceDraft ? 'voice' : 'text');
    setText('');
    setIsVoiceDraft(false);
    reset();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      stop();
    } else {
      setIsVoiceDraft(true);
      start();
    }
  };

  const cancelVoice = () => {
    stop();
    reset();
    setText('');
    setIsVoiceDraft(false);
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-2xl shadow-lg transition-all">
      {/* Voice listening status banner */}
      {listening && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">Listening... speak now</span>
          </div>
          <button
            onClick={stop}
            className="text-xs font-bold underline hover:text-rose-700"
          >
            Done
          </button>
        </div>
      )}

      {/* Voice draft notice */}
      {isVoiceDraft && !listening && text && (
        <div className="flex items-center justify-between px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-600 dark:text-brand-300">
          <span>Voice transcript loaded. Review and edit before sending.</span>
          <button
            onClick={cancelVoice}
            className="p-0.5 hover:bg-brand-500/20 rounded-full"
            title="Clear voice draft"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-1">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!transcript) setIsVoiceDraft(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            listening
              ? 'Listening...'
              : 'Ask Defiy anything, or log meals, workouts, goals...'
          }
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm py-2 px-1 focus:ring-0 max-h-36 overflow-y-auto"
        />

        {/* Mic Button */}
        {supported && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled}
            className={`p-2.5 rounded-xl transition-all ${
              listening
                ? 'bg-rose-500 text-white animate-bounce shadow-md shadow-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
            }`}
            title={listening ? 'Stop listening' : 'Speak to Defiy OS'}
          >
            {listening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
            text.trim() && !disabled
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 scale-100'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
