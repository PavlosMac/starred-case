import { getJobs, getFavorites, getUsers } from './actions'
import { JobsPage } from './JobsPage'

const DEFAULT_USER_ID = 1

export default async function Home() {
  const [jobsResponse, favoriteIds, users] = await Promise.all([
    getJobs(1),
    getFavorites(DEFAULT_USER_ID),
    getUsers(),
  ])

  return (
    <JobsPage
      initialJobs={jobsResponse.jobs}
      initialPagination={jobsResponse.pagination}
      initialFavorites={favoriteIds}
      users={users}
      initialUserId={DEFAULT_USER_ID}
    />
  )
}
