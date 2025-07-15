import React, { memo } from 'react';

// Input Component with validation
const Input = memo(({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  className = '',
  placeholder = '',
  disabled = false,
  min,
  max,
  step,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-3 py-2 text-base border rounded-lg transition-colors duration-200
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
          }
          dark:text-white placeholder-gray-400
        `}

        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel || label}
        aria-describedby={error ? errorId : ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Input; 