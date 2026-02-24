import type {
  Job,
  ExternalJob,
  ExternalJobsListResponse,
  JobsResponse,
} from '../types'

export function serializeJob(externalJob: ExternalJob): Job {
  return {
    id: externalJob.id,
    title: externalJob.job_title,
    company: externalJob.company,
    description: externalJob.description,
  }
}

export function serializeJobsResponse(
  response: ExternalJobsListResponse
): JobsResponse {
  return {
    jobs: response.data.map(serializeJob),
    pagination: {
      currentPage: response.pagination.currentPage,
      totalPages: response.pagination.lastPage + 1,
    },
  }
}
