'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: `
    bg-gradient-to-r from-violet-600 to-indigo-600
    hover:from-violet-500 hover:to-indigo-500
    text-white font-semibold
    shadow-lg shadow-violet-500/20
    hover:shadow-xl hover:shadow-violet-500/30
    border border-violet-500/20
    hover:-translate-y-[1px]
  `,
  secondary: `
    bg-white/[0.04] hover:bg-white/[0.08]
    text-white/80 hover:text-white
    border border-white/[0.08] hover:border-white/[0.15]
    shadow-sm
  `,
  danger: `
    bg-rose-500/10 hover:bg-rose-500/20
    text-rose-400 hover:text-rose-300
    border border-rose-500/20 hover:border-rose-500/30
    shadow-sm
  `,
  ghost: `
    bg-transparent hover:bg-white/[0.05]
    text-white/60 hover:text-white
    border border-transparent
  `,
  outline: `
    bg-transparent hover:bg-violet-500/10
    text-violet-400 hover:text-violet-300
    border border-violet-500/30 hover:border-violet-400/50
  `,
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.97]
        focus-ring
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
