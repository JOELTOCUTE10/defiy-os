import React from 'react';
import { Volume2, VolumeX, Sparkles, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { ChatMessage, ChatAction } from '../../api/types';
import { useSpeech } from '../../hooks/useSpeech';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const { speak, stop, speaking, currentText, supported } = useSpeech();

  const isSpeakingThis = speaking && currentText === message.content;

  const toggleSpeech = () => {
    if (isSpeakingThis) {
      stop();
    } else {
      speak(message.content);
    }
  };

  // Markdown-lite renderer
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Inline bold parsing
      const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900 dark:text-slate-100">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      };

      const trimmed = line.trim();

      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-brand-500 font-bold">•</span>
            <span>{parseInline(trimmed.slice(2))}</span>
          </div>
        );
      }

      // Numbered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="font-bold text-brand-500">{numMatch[1]}.</span>
            <span>{parseInline(numMatch[2])}</span>
          </div>
        );
      }

      // Headers (# or ##)
      if (trimmed.startsWith('# ')) {
        return (
          <h3 key={idx} className="text-base font-bold my-1 text-slate-900 dark:text-slate-100">
            {parseInline(trimmed.slice(2))}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h4 key={idx} className="text-sm font-bold my-1 text-slate-900 dark:text-slate-100">
            {parseInline(trimmed.slice(3))}
          </h4>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Paragraph
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div
      className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] ${
        isUser ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
        {!isUser ? (
          <div className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Defiy AI</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 font-semibold text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>You</span>
          </div>
        )}
        {message.created_date && (
          <span className="text-[10px] opacity-75">
            {new Date(message.created_date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      <div
        className={`relative group px-4 py-3 rounded-2xl text-sm transition-all shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-brand-600 to-brand-accent text-white rounded-tr-xs'
            : 'bg-white dark:bg-darkcard text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-darkborder rounded-tl-xs'
        }`}
      >
        <div className="break-words space-y-1">{renderFormattedContent(message.content)}</div>

        {/* TTS Speaker Button for AI message */}
        {!isUser && supported && (
          <button
            onClick={toggleSpeech}
            className={`mt-2 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition-colors ${
              isSpeakingThis
                ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/40'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title={isSpeakingThis ? 'Stop speaking' : 'Read message aloud'}
          >
            {isSpeakingThis ? (
              <>
                <VolumeX className="w-3 h-3 animate-pulse" />
                <span>Speaking...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3" />
                <span>Listen</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Action Chips under AI message */}
      {!isUser && message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {message.actions.map((act: ChatAction, i: number) => {
            const status = act.status || 'executed';
            return (
              <div
                key={i}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border font-medium transition-all ${
                  status === 'executed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : status === 'failed'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                {status === 'executed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                {status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                <span>{act.label || formatActionName(act.action)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
