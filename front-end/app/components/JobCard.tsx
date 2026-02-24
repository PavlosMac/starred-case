'use client'

import type { Job } from '../types'
import { StarIcon } from './icons'

interface JobCardProps {
  job: Job
  isFavorited?: boolean
  onToggleFavorite: (jobId: number) => void
}

export function JobCard({
  job,
  isFavorited = false,
  onToggleFavorite,
}: JobCardProps) {
  return (
    <article
      className="
        group relative
        rounded-xl p-5
        bg-gradient-to-br from-space-surface/95 to-space-elevated/90
        border border-white/[0.06]
        transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:border-stellar-bright/20
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,245,212,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]
        hover:-translate-y-0.5
        backdrop-blur-sm
      "
    >
      {/* Subtle glow accent on hover */}
      <div
        className="
          absolute -inset-px rounded-xl opacity-0
          bg-gradient-to-br from-stellar-bright/10 via-transparent to-nebula-bright/5
          transition-opacity duration-300
          group-hover:opacity-100
          pointer-events-none
        "
        aria-hidden="true"
      />

      {/* Corner accent - avant-garde diagonal cut feel */}
      <div
        className="
          absolute top-0 right-0 w-16 h-16
          bg-gradient-to-bl from-stellar-bright/5 to-transparent
          rounded-tr-xl
          pointer-events-none
        "
        aria-hidden="true"
      />

      <div className="relative flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Job title with display font */}
          <h2
            className="
              text-lg font-semibold text-cosmos-100
              font-[family-name:var(--font-family-display)]
              tracking-tight
              group-hover:text-stellar-glow
              transition-colors duration-200
            "
          >
            {job.title}
          </h2>

          {/* Company name */}
          <p className="text-sm text-cosmos-60 mt-1.5 flex items-center gap-2">
            <span
              className="
                inline-block w-1.5 h-1.5 rounded-full
                bg-stellar-medium
                group-hover:bg-stellar-glow
                group-hover:shadow-[0_0_8px_rgba(0,245,212,0.5)]
                transition-all duration-200
              "
              aria-hidden="true"
            />
            {job.company}
          </p>
        </div>

        {/* Star/Favorite button */}
        <button
          type="button"
          className="
            relative p-2 -m-2
            rounded-lg
            transition-all duration-150
            hover:bg-nova-subtle
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-nova-warm/50
            focus-visible:ring-offset-2 focus-visible:ring-offset-space-surface
          "
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => onToggleFavorite(job.id)}
        >
          <StarIcon filled={isFavorited} />
        </button>
      </div>

      {/* Description */}
      <p
        className="
          relative z-10
          text-sm text-cosmos-60 mt-4
          line-clamp-2 leading-relaxed
        "
      >
        {job.description}
      </p>

      {/* Bottom accent line - high-tempo feel */}
      <div
        className="
          absolute bottom-0 left-5 right-5 h-px
          bg-gradient-to-r from-transparent via-stellar-bright/20 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
        aria-hidden="true"
      />
    </article>
  )
}
