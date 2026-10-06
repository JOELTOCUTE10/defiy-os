import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-5 border transition-all duration-200';
  
  const variants = {
    default:
      'bg-white dark:bg-darkcard border-slate-200/80 dark:border-darkborder shadow-sm hover:shadow-md',
    glass:
      'bg-white/80 dark:bg-darkcard/80 backdrop-blur-md border-slate-200/60 dark:border-darkborder/60 shadow-sm',
    gradient:
      'bg-gradient-to-br from-brand-500/10 via-brand-accent/5 to-transparent border-brand-500/20 dark:border-brand-500/30 shadow-sm',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
