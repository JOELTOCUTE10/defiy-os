import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SectionNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface SectionNavProps {
  items: SectionNavItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const SectionNav: React.FC<SectionNavProps> = ({
  items,
  activeId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 ${className}`}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
              isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkborder hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
