import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref
) {
  const inputId = id || rest.name || `in-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="form-group">
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <input id={inputId} ref={ref} className={className} {...rest} />
      {error ? <span className="error">{error}</span> : null}
    </div>
  );
});

export default Input;
