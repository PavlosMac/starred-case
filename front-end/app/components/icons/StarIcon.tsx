'use client'

interface StarIconProps {
  size?: number
  filled?: boolean
  className?: string
}

export function StarIcon({
  size = 24,
  filled = false,
  className = '',
}: StarIconProps) {
  return (
    <span
      className={`
        relative inline-flex items-center justify-center
        ${filled ? 'animate-star-burst' : ''}
        ${className}
      `}
    >
      {/* Main star */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          relative z-10
          cursor-pointer
          transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${
            filled
              ? `
                text-nova-bright
                drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]
                hover:drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]
                hover:scale-110
              `
              : `
                text-cosmos-40
                hover:text-nova-warm
                hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.3)]
                hover:scale-105
              `
          }
        `}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>

      {/* Sparkle particles when filled */}
      {filled && (
        <>
          {/* Top-right sparkle */}
          <span
            className="
              absolute top-0 right-0
              w-1 h-1 rounded-full
              bg-nova-bright
              animate-ping
              opacity-75
            "
            style={{ animationDuration: '1s' }}
            aria-hidden="true"
          />
          {/* Bottom-left sparkle */}
          <span
            className="
              absolute bottom-1 left-0
              w-0.5 h-0.5 rounded-full
              bg-nova-warm
              animate-ping
              opacity-60
            "
            style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}
            aria-hidden="true"
          />
          {/* Center glow */}
          <span
            className="
              absolute inset-0
              flex items-center justify-center
              pointer-events-none
            "
            aria-hidden="true"
          >
            <span
              className="
                w-3 h-3 rounded-full
                bg-nova-bright/30
                blur-sm
                animate-pulse
              "
            />
          </span>
        </>
      )}
    </span>
  )
}
