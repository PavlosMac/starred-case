'use server'

import type {
  Job,
  JobsResponse,
  ExternalJob,
  ExternalJobsListResponse,
  ExternalSearchResponse,
  ActionResult,
} from '../types'
import { serializeJob, serializeJobsResponse } from '../lib/serializers'

export async function getJobs(page: number = 1): Promise<ActionResult<JobsResponse>> {
  try {
    const response = await fetch(`${process.env.AWS_API_BASE}/jobs?page=${page}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error('Failed to fetch jobs:', response.statusText)
      return {
        success: false,
        error: { message: 'Failed to load jobs. Please try again.', code: 'fetch_error' },
      }
    }

    const data: ExternalJobsListResponse = await response.json()
    return { success: true, data: serializeJobsResponse(data) }
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return {
      success: false,
      error: { message: 'Network error. Please check your connection.', code: 'network_error' },
    }
  }
}

export async function getJobById(id: number): Promise<ActionResult<Job>> {
  try {
    const response = await fetch(`${process.env.AWS_API_BASE}/jobs/${id}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return {
        success: false,
        error: { message: 'Job not found.', code: 'not_found' },
      }
    }

    const data: ExternalJob = await response.json()
    return { success: true, data: serializeJob(data) }
  } catch (error) {
    console.error('Failed to fetch job:', error)
    return {
      success: false,
      error: { message: 'Failed to load job details.', code: 'network_error' },
    }
  }
}

export async function getJobsByIds(ids: number[]): Promise<ActionResult<Job[]>> {
  if (ids.length === 0) {
    return { success: true, data: [] }
  }

  const results = await Promise.all(ids.map((id) => getJobById(id)))
  const jobs = results
    .filter((result): result is { success: true; data: Job } => result.success)
    .map((result) => result.data)

  // Return success even if some jobs failed - we return what we could fetch
  return { success: true, data: jobs }
}

export async function searchJobs(jobTitle: string): Promise<ActionResult<Job[]>> {
  try {
    const response = await fetch(`${process.env.AWS_API_BASE}/jobs/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobTitle }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Search error:', errorData)
      return {
        success: false,
        error: { message: 'Search failed. Please try again.', code: 'search_error' },
      }
    }

    const data: ExternalSearchResponse = await response.json()

    if (!data.jobIds || data.jobIds.length === 0) {
      return { success: true, data: [] }
    }

    const result = await getJobsByIds(data.jobIds.slice(0, 20))
    return result
  } catch (error) {
    console.error('Failed to search jobs:', error)
    return {
      success: false,
      error: { message: 'Network error. Please check your connection.', code: 'network_error' },
    }
  }
}
