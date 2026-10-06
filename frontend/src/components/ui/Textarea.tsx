import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-darkcard text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-darkborder'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-500 mt-1">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
