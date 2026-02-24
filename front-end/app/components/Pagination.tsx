'use client'

import { useMemo } from 'react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  maxVisiblePages?: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  maxVisiblePages = 5,
  onPageChange,
}: PaginationProps) {
  const visiblePages = useMemo(() => {
    const pages: number[] = []
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }, [currentPage, totalPages, maxVisiblePages])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <nav
      className="flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      {/* Previous button */}
      <Button
        variant="tertiary"
        disabled={currentPage === 1}
        padding="px-3"
        onClick={() => goToPage(currentPage - 1)}
        className="
          text-cosmos-60 hover:text-cosmos-100
          disabled:text-cosmos-20
        "
        aria-label="Go to previous page"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          const isActive = page === currentPage

          return (
            <button
              key={page}
              onClick={() => goToPage(page)}
              disabled={isActive}
              className={`
                relative w-10 h-10
                rounded-lg
                text-sm font-medium
                transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-stellar-bright/50
                ${
                  isActive
                    ? `
                      bg-stellar-bright text-space-void
                      shadow-[0_0_20px_rgba(0,245,212,0.3)]
                    `
                    : `
                      text-cosmos-60
                      hover:text-cosmos-100
                      hover:bg-space-elevated
                    `
                }
              `}
              style={{
                animationDelay: `${index * 30}ms`,
              }}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active page glow pulse */}
              {isActive && (
                <span
                  className="
                    absolute inset-0 rounded-lg
                    bg-stellar-glow/20
                    animate-pulse
                  "
                  aria-hidden="true"
                />
              )}
              <span className="relative">{page}</span>
            </button>
          )
        })}
      </div>

      {/* Next button */}
      <Button
        variant="tertiary"
        disabled={currentPage === totalPages}
        padding="px-3"
        onClick={() => goToPage(currentPage + 1)}
        className="
          text-cosmos-60 hover:text-cosmos-100
          disabled:text-cosmos-20
        "
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
    </nav>
  )
}
