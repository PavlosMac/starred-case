import { getJobs, getFavorites, getUsers } from './actions'
import { JobsPage } from './JobsPage'

const DEFAULT_USER_ID = 1

export default async function Home() {
  const [jobsResult, favoritesResult, usersResult] = await Promise.all([
    getJobs(1),
    getFavorites(DEFAULT_USER_ID),
    getUsers(),
  ])

  // Extract data with fallbacks for failed requests
  const jobs = jobsResult.success ? jobsResult.data.jobs : []
  const pagination = jobsResult.success
    ? jobsResult.data.pagination
    : { currentPage: 1, totalPages: 1 }
  const favorites = favoritesResult.success ? favoritesResult.data : []
  const users = usersResult.success ? usersResult.data : []

  // Collect any initial errors to display
  const initialErrors: string[] = []
  if (!jobsResult.success) initialErrors.push(jobsResult.error.message)
  if (!favoritesResult.success) initialErrors.push(favoritesResult.error.message)
  if (!usersResult.success) initialErrors.push(usersResult.error.message)

  return (
    <JobsPage
      initialJobs={jobs}
      initialPagination={pagination}
      initialFavorites={favorites}
      users={users}
      initialUserId={DEFAULT_USER_ID}
      initialError={initialErrors.length > 0 ? initialErrors[0] : null}
    />
  )
}
