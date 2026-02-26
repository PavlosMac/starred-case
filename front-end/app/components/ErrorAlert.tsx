'use client'

import { useEffect } from 'react'

interface ErrorAlertProps {
  message: string
  onDismiss: () => void
  /** Auto-dismiss after this many milliseconds (0 = no auto-dismiss) */
  autoDismiss?: number
  /** Visual variant */
  variant?: 'inline' | 'banner'
}

/**
 * Reusable error alert component
 * - Displays error message with dismiss button
 * - Optional auto-dismiss for transient errors
 */
export function ErrorAlert({
  message,
  onDismiss,
  autoDismiss = 0,
  variant = 'inline',
}: ErrorAlertProps) {
  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(onDismiss, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onDismiss])

  if (variant === 'banner') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{message}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Inline variant (default)
  return (
    <div className="text-center py-2">
      <p className="text-brand-error-60 text-sm">{message}</p>
      <button
        type="button"
        className="text-brand-primary-60 hover:underline text-sm mt-1"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  )
}
