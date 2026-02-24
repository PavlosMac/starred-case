'use client'

interface CheckboxProps {
  id?: string
  checked?: boolean
  label?: string
  onChange?: (checked: boolean) => void
}

export function Checkbox({
  id,
  checked = false,
  label,
  onChange,
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="group relative flex items-center gap-3 cursor-pointer select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        className="peer sr-only"
        onChange={(e) => onChange?.(e.target.checked)}
      />

      {/* Custom checkbox */}
      <span
        className={`
          relative inline-flex items-center justify-center
          w-5 h-5
          rounded-md
          border
          transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${
            checked
              ? `
                bg-stellar-bright border-stellar-bright
                shadow-[0_0_12px_rgba(0,245,212,0.4)]
              `
              : `
                bg-space-surface border-space-border
                group-hover:border-cosmos-40
              `
          }
          peer-focus-visible:ring-2 peer-focus-visible:ring-stellar-bright/50
          peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-space-deep
        `}
      >
        {/* Checkmark with star-burst animation */}
        <svg
          className={`
            w-3 h-3 text-space-void
            transition-all duration-200
            ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          `}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 6l3 3 5-6" />
        </svg>

        {/* Sparkle effect on check */}
        {checked && (
          <>
            <span
              className="
                absolute -top-1 -right-1 w-1.5 h-1.5
                bg-stellar-glow rounded-full
                animate-ping
              "
              aria-hidden="true"
            />
            <span
              className="
                absolute -bottom-0.5 -left-0.5 w-1 h-1
                bg-stellar-bright rounded-full
                animate-ping
                [animation-delay:100ms]
              "
              aria-hidden="true"
            />
          </>
        )}
      </span>

      {/* Label */}
      {label && (
        <span
          className={`
            text-sm
            transition-colors duration-150
            ${checked ? 'text-cosmos-100' : 'text-cosmos-70 group-hover:text-cosmos-90'}
          `}
        >
          {label}
        </span>
      )}
    </label>
  )
}
