import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-ocean-500 to-coastal-500 
      hover:from-ocean-600 hover:to-coastal-600
      text-white shadow-lg shadow-ocean-500/25
      focus:ring-ocean-500 hover:scale-[1.02]
      dark:focus:ring-offset-slate-900
    `,
    secondary: `
      bg-slate-100 dark:bg-slate-700 
      hover:bg-slate-200 dark:hover:bg-slate-600
      text-slate-700 dark:text-slate-200
      focus:ring-slate-500
      dark:focus:ring-offset-slate-900
    `,
    outline: `
      border-2 border-ocean-500 dark:border-ocean-400
      text-ocean-600 dark:text-ocean-400
      hover:bg-ocean-50 dark:hover:bg-ocean-900/20
      focus:ring-ocean-500
      dark:focus:ring-offset-slate-900
    `,
    ghost: `
      text-slate-600 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800
      focus:ring-slate-500
      dark:focus:ring-offset-slate-900
    `,
    danger: `
      bg-red-500 hover:bg-red-600
      text-white
      focus:ring-red-500
      dark:focus:ring-offset-slate-900
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;