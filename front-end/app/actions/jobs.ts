'use server'

import type {
  Job,
  JobsResponse,
  ExternalJob,
  ExternalJobsListResponse,
  ExternalSearchResponse,
} from '../types'
import { serializeJob, serializeJobsResponse } from '../lib/serializers'


export async function getJobs(page: number = 1): Promise<JobsResponse> {
  try {
    const response = await fetch(`${process.env.AWS_API_BASE}/jobs?page=${page}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error('Failed to fetch jobs:', response.statusText)
      return {
        jobs: [],
        pagination: { currentPage: 1, totalPages: 1 },
      }
    }

    const data: ExternalJobsListResponse = await response.json()
    return serializeJobsResponse(data)
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    return {
      jobs: [],
      pagination: { currentPage: 1, totalPages: 1 },
    }
  }
}

export async function getJobById(id: number): Promise<Job | null> {
  try {
    const response = await fetch(`${process.env.AWS_API_BASE}/jobs/${id}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const data: ExternalJob = await response.json()
    return serializeJob(data)
  } catch (error) {
    console.error('Failed to fetch job:', error)
    return null
  }
}

export async function getJobsByIds(ids: number[]): Promise<Job[]> {
  if (ids.length === 0) return []

  const jobPromises = ids.map((id) => getJobById(id))
  const jobs = await Promise.all(jobPromises)

  return jobs.filter((job): job is Job => job !== null)
}

export async function searchJobs(jobTitle: string): Promise<Job[]> {
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
      const error = await response.json()
      console.error('Search error:', error)
      return []
    }

    const data: ExternalSearchResponse = await response.json()

    if (!data.jobIds || data.jobIds.length === 0) {
      return []
    }

    const jobPromises = data.jobIds.slice(0, 20).map((id) => getJobById(id))
    const jobs = await Promise.all(jobPromises)

    return jobs.filter((job): job is Job => job !== null)
  } catch (error) {
    console.error('Failed to search jobs:', error)
    return []
  }
}
