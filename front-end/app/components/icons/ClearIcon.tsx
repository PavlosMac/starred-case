interface ClearIconProps {
  size?: number
  className?: string
}

export function ClearIcon({ size = 20, className = '' }: ClearIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`
        cursor-pointer
        text-cosmos-40
        hover:text-cosmos-80
        hover:rotate-90
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${className}
      `}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
