interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {/* Orbiting particles */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span
          className="
            absolute w-1.5 h-1.5 rounded-full
            bg-stellar-glow
            shadow-[0_0_6px_rgba(0,245,212,0.6)]
            animate-orbit
          "
        />
        <span
          className="
            absolute w-1 h-1 rounded-full
            bg-stellar-bright
            animate-orbit
            [animation-delay:-0.5s]
            [animation-duration:2s]
          "
        />
      </span>

      {/* Center ring */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-stellar-dim animate-spin-fast"
      >
        <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
        <path d="M21 12a9 9 0 0 0-9-9" className="text-stellar-glow" />
      </svg>
    </span>
  )
}
