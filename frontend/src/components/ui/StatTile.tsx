import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface StatTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  color,
  onClick,
  className = '',
}) => {
  const sub = subtitle || description;
  const iColor = iconColor || color || 'text-brand-500 bg-brand-50 dark:bg-brand-500/10';

  return (
    <Card
      onClick={onClick}
      className={`flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-brand-500/50' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        {sub && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {sub}
          </p>
        )}
      </div>
    </Card>
  );
};
