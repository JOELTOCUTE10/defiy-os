import React from 'react';

export const TypingDots: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit rounded-tl-sm border border-slate-200/50 dark:border-slate-700/50">
      <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"></span>
    </div>
  );
};
