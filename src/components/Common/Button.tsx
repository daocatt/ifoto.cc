import React from 'react'
import { clsx } from 'clsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'warm' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  pill?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  pill = true,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none focus:outline-none'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm border border-transparent',
    secondary: 'bg-card text-ink hover:bg-warm border border-edge shadow-xs',
    outline: 'bg-transparent text-ink hover:bg-warm border border-edge shadow-xs',
    warm: 'bg-warm text-ink hover:bg-edge/40 border border-edge/60',
    danger: 'bg-danger-deep text-white hover:bg-danger-dark border border-transparent shadow-xs',
    ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-warm/60 border border-transparent'
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
    icon: 'p-2 w-9 h-9'
  }

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        pill ? 'rounded-full' : 'rounded-xl',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
