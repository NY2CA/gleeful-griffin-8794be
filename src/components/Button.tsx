import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  const width = fullWidth ? 'w-full justify-center' : '';
  return (
    <button className={`${base} ${width} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
