import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hero' | 'offer';
}

export default function Card({
  variant = 'default',
  className = '',
  children,
  ...rest
}: CardProps) {
  const base =
    variant === 'hero'
      ? 'hero-card'
      : variant === 'offer'
      ? 'offer-card'
      : 'bg-white border border-line rounded-xs p-8 shadow-soft';
  return (
    <div className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
