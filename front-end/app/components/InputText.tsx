'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface InputTextProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  invalid?: boolean
  preIcon?: ReactNode
  postIcon?: ReactNode
  onPreIconClick?: () => void
  onPostIconClick?: () => void
  onChange?: (value: string) => void
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  function InputText(
    {
      id,
      invalid = false,
      preIcon,
      postIcon,
      onPreIconClick,
      onPostIconClick,
      onChange,
      className = '',
      ...props
    },
    ref
  ) {
    return (
      <div className="group relative flex items-center">
        {/* Glow effect on focus */}
        <div
          className="
            absolute -inset-0.5 rounded-xl opacity-0
            bg-gradient-to-r from-stellar-bright/20 via-stellar-glow/10 to-stellar-bright/20
            blur-sm
            transition-opacity duration-200
            group-focus-within:opacity-100
            pointer-events-none
          "
          aria-hidden="true"
        />

        {preIcon && (
          <label
            htmlFor={id}
            className="
              absolute left-4 z-10
              text-cosmos-40
              transition-colors duration-150
              group-focus-within:text-stellar-bright
              cursor-pointer
            "
            onClick={onPreIconClick}
          >
            {preIcon}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          autoComplete="off"
          className={`
            relative grow
            w-full h-12
            text-sm text-cosmos-90
            placeholder:text-cosmos-40
            bg-space-surface
            border border-space-border
            rounded-xl
            leading-tight
            transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
            hover:border-cosmos-20
            focus:outline-none
            focus:border-stellar-bright
            focus:shadow-[0_0_0_3px_rgba(0,245,212,0.1),0_0_20px_rgba(0,245,212,0.1)]
            read-only:bg-space-elevated
            read-only:border-transparent
            read-only:cursor-default
            ${invalid ? 'border-status-error focus:border-status-error focus:shadow-[0_0_0_3px_rgba(255,82,82,0.15)]' : ''}
            ${preIcon ? 'pl-12' : 'pl-4'}
            ${postIcon ? 'pr-12' : 'pr-4'}
            ${className}
          `}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />

        {postIcon && (
          <label
            htmlFor={id}
            className="
              absolute right-4 z-10
              text-cosmos-40
              hover:text-cosmos-80
              transition-colors duration-150
              cursor-pointer
            "
            onClick={onPostIconClick}
          >
            {postIcon}
          </label>
        )}
      </div>
    )
  }
)
