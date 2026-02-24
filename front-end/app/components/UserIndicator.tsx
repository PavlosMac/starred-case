'use client'

import type { User } from '../actions'

interface UserIndicatorProps {
  users: User[]
  currentUserId: number
  onUserChange: (userId: number) => void
}

export function UserIndicator({
  users,
  currentUserId,
  onUserChange,
}: UserIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <span className="relative flex h-2 w-2">
        <span
          className="
            absolute inline-flex h-full w-full rounded-full
            bg-stellar-glow opacity-75 animate-ping
          "
          aria-hidden="true"
        />
        <span
          className="
            relative inline-flex h-2 w-2 rounded-full
            bg-stellar-bright
            shadow-[0_0_6px_rgba(0,245,212,0.5)]
          "
          aria-hidden="true"
        />
      </span>

      <span className="text-xs text-cosmos-50 tracking-wide uppercase">
        Viewing as
      </span>

      <div className="relative">
        <select
          value={currentUserId}
          onChange={(e) => onUserChange(parseInt(e.target.value, 10))}
          className="
            appearance-none
            bg-space-elevated
            text-cosmos-90
            pl-3 pr-8 py-1.5
            rounded-lg
            text-xs font-medium
            border border-space-border
            cursor-pointer
            transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]
            hover:border-cosmos-40
            hover:bg-space-border
            focus:outline-none
            focus:border-stellar-bright
            focus:shadow-[0_0_0_2px_rgba(0,245,212,0.1)]
          "
        >
          {users.map((user) => (
            <option
              key={user.id}
              value={user.id}
              className="bg-space-surface text-cosmos-90"
            >
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <span
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            pointer-events-none
            text-cosmos-50
          "
          aria-hidden="true"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  )
}
