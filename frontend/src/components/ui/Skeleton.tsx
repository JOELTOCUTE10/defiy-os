import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'rect';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const base = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl';

  const variants = {
    text: 'h-4 w-full rounded-md',
    avatar: 'h-10 w-10 rounded-full shrink-0',
    button: 'h-10 w-24 rounded-xl',
    card: 'h-32 w-full rounded-2xl',
    rect: 'h-20 w-full rounded-xl',
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${base} ${variants[variant]} ${className}`}
        />
      ))}
    </>
  );
};
