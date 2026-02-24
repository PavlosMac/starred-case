// Job entity from external API (snake_case from API)
export interface ExternalJob {
  id: number
  job_title: string
  company: string
  description: string
}

// Normalized job entity for frontend (camelCase)
export interface Job {
  id: number
  title: string
  company: string
  description: string
}

// External API response for listing jobs
export interface ExternalJobsListResponse {
  pagination: {
    currentPage: number
    firstPage: number
    lastPage: number
  }
  data: ExternalJob[]
}

// External API response for search (returns only IDs)
export interface ExternalSearchResponse {
  searchQuery: {
    jobTitle: string
  }
  jobIds: number[]
}

// Normalized response for our API
export interface JobsListResponse {
  jobs: Job[]
  pagination: {
    currentPage: number
    totalPages: number
  }
}

export interface JobSearchResponse {
  jobs: Job[]
}

// Internal API response format
export interface ApiResponse<T> {
  data: T
  error: Record<string, unknown>
}

export interface ApiErrorResponse {
  error: string
}

// User entity (from database)
export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  salt: string
}

// Favorite entity
export interface Favorite {
  id: number
  userId: number
  jobId: number
  createdAt: string
}
