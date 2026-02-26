'use client'

import { useState, useCallback, useTransition, useRef, useEffect } from 'react'
import type { Job } from './types'
import {
  getJobs,
  getJobsByIds,
  searchJobs,
  toggleFavorite,
  getFavorites,
} from './actions'
import type { User } from './actions'
import { useDebounce } from './hooks'
import {
  InputText,
  Checkbox,
  Pagination,
  JobCard,
  UserIndicator,
  SearchIcon,
  ClearIcon,
  Spinner,
  ErrorAlert,
} from './components'

const MIN_SEARCH_LENGTH = 2
const DEBOUNCE_DELAY = 500

interface JobsPageProps {
  initialJobs: Job[]
  initialPagination: {
    currentPage: number
    totalPages: number
  }
  initialFavorites: number[]
  users: User[]
  initialUserId: number
  initialError?: string | null
}

export function JobsPage({
  initialJobs,
  initialPagination,
  initialFavorites,
  users,
  initialUserId,
  initialError = null,
}: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [pagination, setPagination] = useState(initialPagination)
  const [favorites, setFavorites] = useState<Set<number>>(
    new Set(initialFavorites)
  )
  const [userId, setUserId] = useState(initialUserId)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(initialError)

  // Cache for restoring paginated view after favorites mode
  const cachedPaginatedJobs = useRef<{
    jobs: Job[]
    pagination: { currentPage: number; totalPages: number }
  } | null>(null)

  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY)
  const latestSearchRef = useRef<string>('')

  // Handle debounced search
  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim()

    // Empty query - reset to paginated list
    if (!trimmedQuery) {
      if (isSearchMode) {
        setIsSearchMode(false)
        setIsSearching(false)
        startTransition(async () => {
          const result = await getJobs(1)
          if (result.success) {
            setJobs(result.data.jobs)
            setPagination(result.data.pagination)
            setError(null)
          } else {
            setError(result.error.message)
          }
        })
      }
      return
    }

    // Minimum character requirement
    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      return
    }

    // Perform search
    latestSearchRef.current = trimmedQuery
    setIsSearchMode(true)
    setIsSearching(true)

    const performSearch = async () => {
      const result = await searchJobs(trimmedQuery)

      // Ignore stale results if user typed something else
      if (latestSearchRef.current !== trimmedQuery) {
        return
      }

      if (result.success) {
        setJobs(result.data)
        setPagination({ currentPage: 1, totalPages: 1 })
        setError(null)
      } else {
        setError(result.error.message)
        setJobs([])
      }
      setIsSearching(false)
    }

    performSearch()
  }, [debouncedSearchQuery, isSearchMode])

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim().length >= MIN_SEARCH_LENGTH) {
      setIsSearching(true)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setIsSearchMode(false)
    setIsSearching(false)
    latestSearchRef.current = ''
    startTransition(async () => {
      const result = await getJobs(1)
      if (result.success) {
        setJobs(result.data.jobs)
        setPagination(result.data.pagination)
        setError(null)
      } else {
        setError(result.error.message)
      }
    })
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      if (isSearchMode || showFavoritesOnly) return

      startTransition(async () => {
        const result = await getJobs(page)
        if (result.success) {
          setJobs(result.data.jobs)
          setPagination(result.data.pagination)
        } else {
          setError(result.error.message)
        }
      })
    },
    [isSearchMode, showFavoritesOnly]
  )

  const handleFavoritesToggle = useCallback(
    (enabled: boolean) => {
      setShowFavoritesOnly(enabled)

      if (enabled) {
        // Cache current paginated state before switching
        if (!isSearchMode) {
          cachedPaginatedJobs.current = { jobs, pagination }
        }

        // Fetch favorite jobs
        startTransition(async () => {
          const favoriteIds = Array.from(favorites)
          if (favoriteIds.length === 0) {
            setJobs([])
            setPagination({ currentPage: 1, totalPages: 1 })
            return
          }
          const result = await getJobsByIds(favoriteIds)
          if (result.success) {
            setJobs(result.data)
            setPagination({ currentPage: 1, totalPages: 1 })
          } else {
            setError(result.error.message)
          }
        })
      } else {
        // Restore cached paginated state or fetch page 1
        if (cachedPaginatedJobs.current && !isSearchMode) {
          setJobs(cachedPaginatedJobs.current.jobs)
          setPagination(cachedPaginatedJobs.current.pagination)
        } else {
          startTransition(async () => {
            const result = await getJobs(1)
            if (result.success) {
              setJobs(result.data.jobs)
              setPagination(result.data.pagination)
            } else {
              setError(result.error.message)
            }
          })
        }
      }
    },
    [favorites, jobs, pagination, isSearchMode]
  )

  const handleToggleFavorite = useCallback(
    async (jobId: number) => {
      const isFavorited = favorites.has(jobId)

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev)
        if (isFavorited) {
          next.delete(jobId)
        } else {
          next.add(jobId)
        }
        return next
      })

      const result = await toggleFavorite(jobId, isFavorited, userId)

      if (!result.success) {
        // Rollback optimistic update
        setFavorites((prev) => {
          const next = new Set(prev)
          if (isFavorited) {
            next.add(jobId)
          } else {
            next.delete(jobId)
          }
          return next
        })
        setError(result.error.message)
      }
    },
    [favorites, userId]
  )

  const handleUserChange = useCallback((newUserId: number) => {
    setUserId(newUserId)
    setShowFavoritesOnly(false)
    cachedPaginatedJobs.current = null

    // Fetch favorites for the new user and reset to paginated jobs view
    startTransition(async () => {
      const [favoritesResult, jobsResult] = await Promise.all([
        getFavorites(newUserId),
        getJobs(1),
      ])

      if (favoritesResult.success) {
        setFavorites(new Set(favoritesResult.data))
      } else {
        setError(favoritesResult.error.message)
        setFavorites(new Set())
      }

      if (jobsResult.success) {
        setJobs(jobsResult.data.jobs)
        setPagination(jobsResult.data.pagination)
      } else {
        setError(jobsResult.error.message)
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-medium text-brand-base-90">
            Find Your Next Role
          </h1>
          <p className="text-sm text-brand-base-60 mt-1">
            Browse available job opportunities
          </p>
        </div>
        <UserIndicator
          users={users}
          currentUserId={userId}
          onUserChange={handleUserChange}
        />
      </header>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <InputText
            value={searchQuery}
            placeholder={`Search by job title...`}
            onChange={handleSearchInput}
            preIcon={
              isSearching ? (
                <Spinner className="text-brand-primary-60" />
              ) : (
                <SearchIcon className="text-brand-base-50" />
              )
            }
            postIcon={
              searchQuery ? (
                <ClearIcon className="text-brand-base-50" />
              ) : undefined
            }
            onPostIconClick={clearSearch}
          />
        </div>
        <Checkbox
          id="favorites-filter"
          checked={showFavoritesOnly}
          label="Favorites only"
          onChange={handleFavoritesToggle}
        />
      </div>

      {isSearchMode && !isPending && (
        <p className="text-sm text-brand-base-60">
          Showing {jobs.length} results for &quot;{searchQuery}&quot;
          <button
            className="text-brand-primary-60 hover:underline ml-2"
            onClick={clearSearch}
          >
            Clear search
          </button>
        </p>
      )}

      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          variant="banner"
        />
      )}

      {isPending && (
        <div className="text-center py-8">
          <p className="text-brand-base-60">Loading jobs...</p>
        </div>
      )}

      {!isPending && (
        <>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brand-base-60">
                {showFavoritesOnly ? 'No favorite jobs yet' : 'No jobs found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isFavorited={favorites.has(job.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && !isSearchMode && !showFavoritesOnly && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  )
}
