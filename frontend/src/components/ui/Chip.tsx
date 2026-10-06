import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  onClick,
  onRemove,
  className = '',
}) => {
  const base =
    'inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-150';

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  };

  const variants = {
    primary:
      'bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20 dark:border-brand-500/30',
    secondary:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    success:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30',
    warning:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30',
    danger:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 dark:border-rose-500/30',
    outline:
      'bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  };

  const interactive = onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : '';

  return (
    <span
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${interactive} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none"
        >
          <X className="w-3 h-3 ml-0.5 shrink-0" />
        </button>
      )}
    </span>
  );
};
