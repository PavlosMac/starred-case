'use client'

import { ReactNode } from 'react'
import type { ButtonVariant, ButtonWeight } from '../types'

interface ButtonProps {
  children?: ReactNode
  title?: string
  variant?: ButtonVariant
  weight?: ButtonWeight
  disabled?: boolean
  loading?: boolean
  id?: string
  padding?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses: Record<ButtonVariant, string[]> = {
  primary: [
    'bg-stellar-bright',
    'text-space-void',
    'border',
    'border-stellar-bright',
    'hover:bg-stellar-glow',
    'hover:border-stellar-glow',
    'hover:shadow-[0_0_25px_rgba(0,245,212,0.4),0_0_50px_rgba(0,245,212,0.15)]',
    'hover:-translate-y-0.5',
    'active:translate-y-0',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-stellar-glow),0_0_20px_rgba(0,245,212,0.3)]',
  ],
  secondary: [
    'bg-stellar-subtle',
    'text-stellar-glow',
    'border',
    'border-stellar-dim/30',
    'hover:bg-stellar-ghost',
    'hover:border-stellar-medium/50',
    'hover:shadow-[0_0_15px_rgba(0,245,212,0.2)]',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-stellar-medium)]',
  ],
  tertiary: [
    'bg-transparent',
    'text-cosmos-80',
    'border',
    'border-transparent',
    'hover:bg-space-elevated',
    'hover:text-cosmos-100',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-cosmos-40)]',
  ],
  infoPrimary: [
    'bg-status-info',
    'text-space-void',
    'border',
    'border-status-info',
    'hover:brightness-110',
    'hover:shadow-[0_0_20px_rgba(64,196,255,0.4)]',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-status-info)]',
  ],
  infoSecondary: [
    'bg-brand-info-10',
    'text-status-info',
    'border',
    'border-transparent',
    'hover:bg-brand-info-20',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-status-info)]',
  ],
  infoTertiary: [
    'bg-transparent',
    'text-status-info',
    'border',
    'border-transparent',
    'hover:bg-space-elevated',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-status-info)]',
  ],
  neutralPrimary: [
    'bg-space-elevated',
    'text-cosmos-90',
    'border',
    'border-space-border',
    'hover:bg-space-border',
    'hover:border-cosmos-20',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-cosmos-40)]',
  ],
  neutralTertiary: [
    'bg-transparent',
    'text-cosmos-80',
    'border',
    'border-transparent',
    'hover:bg-space-elevated',
    'hover:text-cosmos-100',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-cosmos-40)]',
  ],
  ghostPrimaryClass: [
    'text-cosmos-80',
    'hover:bg-space-elevated',
    'hover:text-cosmos-100',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-cosmos-40)]',
  ],
  ghostPrimaryClassWithoutHover: ['text-cosmos-80'],
  customPrimary: [
    'bg-stellar-bright',
    'text-space-void',
    'border',
    'border-stellar-bright',
    'hover:bg-stellar-glow',
    'hover:border-stellar-glow',
    'hover:shadow-[0_0_25px_rgba(0,245,212,0.4)]',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-stellar-glow)]',
  ],
  customSecondary: [
    'bg-space-elevated',
    'text-cosmos-90',
    'border',
    'border-space-border',
    'hover:bg-space-border',
    'hover:text-cosmos-100',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-cosmos-40)]',
  ],
  errorPrimary: [
    'bg-status-error',
    'text-white',
    'border',
    'border-status-error',
    'hover:brightness-110',
    'hover:shadow-[0_0_20px_rgba(255,82,82,0.4)]',
    'focus-visible:shadow-[0_0_0_2px_var(--color-space-deep),0_0_0_4px_var(--color-status-error)]',
  ],
}

export function Button({
  children,
  title = '',
  variant = 'primary',
  weight = 'regular',
  disabled = false,
  loading = false,
  id,
  padding = 'px-5',
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const variantClass = variantClasses[variant].join(' ')

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        relative overflow-hidden
        rounded-lg inline-flex gap-2 items-center justify-center h-11
        font-medium text-sm tracking-wide
        transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
        disabled:bg-space-border
        disabled:border-space-border
        disabled:text-cosmos-40
        disabled:cursor-not-allowed
        disabled:shadow-none
        disabled:transform-none
        outline-none
        ${variantClass}
        ${padding}
        ${className}
      `}
    >
      {/* Shimmer effect on hover for primary variants */}
      {(variant === 'primary' || variant === 'customPrimary') && (
        <span
          className="
            absolute inset-0 -translate-x-full
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            group-hover:translate-x-full
            transition-transform duration-700
            pointer-events-none
          "
          aria-hidden="true"
        />
      )}

      {loading && (
        <span className="relative flex items-center justify-center w-5 h-5">
          {/* Orbiting particle */}
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-current animate-orbit"
            aria-hidden="true"
          />
          {/* Center dot */}
          <span
            className="w-1 h-1 rounded-full bg-current opacity-60"
            aria-hidden="true"
          />
        </span>
      )}

      {children || (
        <span
          className={`relative z-10 ${weight} ${disabled ? 'text-cosmos-40' : ''}`}
        >
          {title}
        </span>
      )}
    </button>
  )
}
