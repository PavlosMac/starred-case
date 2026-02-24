export interface Job {
  id: number
  title: string
  company: string
  description: string
}

export interface ExternalJob {
  id: number
  job_title: string
  company: string
  description: string
}

export interface ExternalJobsListResponse {
  pagination: {
    currentPage: number
    firstPage: number
    lastPage: number
  }
  data: ExternalJob[]
}

export interface ExternalSearchResponse {
  searchQuery: {
    jobTitle: string
  }
  jobIds: number[]
}

export interface JobsResponse {
  jobs: Job[]
  pagination: {
    currentPage: number
    totalPages: number
  }
}

export interface FavoritesResponse {
  data: {
    jobIds: number[]
  }
  error: Record<string, unknown>
}

export interface Favorite {
  id: number
  userId: number
  jobId: number
  createdAt: string
}

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'infoPrimary'
  | 'infoSecondary'
  | 'infoTertiary'
  | 'neutralPrimary'
  | 'neutralTertiary'
  | 'ghostPrimaryClass'
  | 'ghostPrimaryClassWithoutHover'
  | 'customPrimary'
  | 'customSecondary'
  | 'errorPrimary'

export type ButtonWeight = 'regular' | 'medium' | 'semibold'
