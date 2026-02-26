# Architecture Summary

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER COMPOSE                                  │
│                                                                             │
│  ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│  │      FRONTEND           │         │           BACKEND               │   │
│  │  (Next.js 16 / React 19)│         │        (Express.js)             │   │
│  │                         │         │                                 │   │
│  │  ┌─────────────────┐    │  HTTP   │  ┌───────────────────────────┐  │   │
│  │  │  app/           │────┼────────►│  │  Routes                   │  │   │
│  │  │  page.tsx       │    │         │  │  /users                   │  │   │
│  │  └─────────────────┘    │         │  │  /api/favorites           │  │   │
│  │           │             │         │  └───────────┬───────────────┘  │   │
│  │           ▼             │         │              │                  │   │
│  │  ┌─────────────────┐    │         │              ▼                  │   │
│  │  │  actions/       │    │         │  ┌───────────────────────────┐  │   │
│  │  │  (Server Actions)│   │         │  │  Services                 │  │   │
│  │  └─────────────────┘    │         │  │  - jobsService.ts         │  │   │
│  │           │             │         │  │  - favoritesService.ts    │  │   │
│  │           ▼             │         │  └───────────┬───────────────┘  │   │
│  │  ┌─────────────────┐    │         │              │                  │   │
│  │  │  components/    │    │         │              ▼                  │   │
│  │  │  JobCard.tsx    │    │         │  ┌───────────────────────────┐  │   │
│  │  │  Pagination.tsx │    │         │  │  Repositories             │  │   │
│  │  └─────────────────┘    │         │  │  - favoritesRepository.ts │  │   │
│  │                         │         │  └───────────┬───────────────┘  │   │
│  │    Port 4000            │         │              │      Port 3001   │   │
│  └─────────────────────────┘         │              ▼                  │   │
│                                      │  ┌───────────────────────────┐  │   │
│                                      │  │  SQLite Database          │  │   │
│                                      │  │  db/starred.db            │  │   │
│                                      │  └───────────────────────────┘  │   │
│                                      └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                               │
                                               │ HTTP
                                               ▼
                                    ┌─────────────────────┐
                                    │   External Jobs API │
                                    │   (AWS Lambda)      │
                                    └─────────────────────┘
```

## Data Flow: Job Listing

```
┌──────────┐                      ┌───────────────────┐    GET /jobs?page=1    ┌──────────────┐
│  Browser │  Server Component    │  Next.js Server   │ ─────────────────────► │ External API │
│          │ ────────────────────►│  (actions/jobs.ts)│                        │   (AWS)      │
│          │                      │                   │◄───────────────────── │              │
│          │◄──────────────────── │  getJobs()        │  { data: [...],       └──────────────┘
└──────────┘  Job[] + pagination  └───────────────────┘    pagination: {...} }
                                             │
                                             ▼
                                  ┌─────────────────────────────┐
                                  │  lib/serializers.ts         │
                                  │                             │
                                  │  1. snake_case → camelCase  │
                                  │     job_title → title       │
                                  │  2. Return typed Job[]      │
                                  └─────────────────────────────┘
```

## Data Flow: Search Jobs

```
┌──────────┐  useDebounce (500ms)  ┌───────────────────┐  POST /jobs/recommendations  ┌──────────────┐
│  Browser │  searchJobs(query)    │  Next.js Server   │  { jobTitle: "React" }       │ External API │
│  Client  │ ─────────────────────►│  (actions/jobs.ts)│ ───────────────────────────► │   (AWS)      │
│          │                       │                   │                              │              │
│          │◄───────────────────── │                   │◄───────────────────────────  │              │
└──────────┘  Job[]                └───────────────────┘  { jobIds: [123, 456, ...] } └──────────────┘
                                                              │
                                      ┌───────────────────────┘
                                      │
                                      ▼
                                   ┌─────────────────────────────────────────┐
                                   │  actions/jobs.ts: searchJobs()          │
                                   │                                         │
                                   │  1. POST /jobs/recommendations → jobIds │
                                   │  2. For each jobId (max 20):            │
                                   │     → GET /jobs/{id}                    │
                                   │  3. Serialize & return Job[]            │
                                   └─────────────────────────────────────────┘

  Frontend (JobsPage.tsx):
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  • User types in InputText                                              │
  │  • useDebounce(searchQuery, 500ms) delays API call                      │
  │  • Min 3 chars required (MIN_SEARCH_LENGTH)                             │
  │  • isSearching state shows Spinner in search input                      │
  │  • latestSearchRef prevents stale results from race conditions          │
  └─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Favorites

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            FAVORITES FLOW                                     │
│  Browser → Next.js Server Action → Express Backend → SQLite                   │
│                                                                               │
│  All requests include X-User-Id header for multi-user support                 │
└──────────────────────────────────────────────────────────────────────────────┘

  USER SWITCHING (UserIndicator dropdown)
  ───────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  1. Page loads → getUsers() fetches all users from /users                │
  │  2. UserIndicator shows dropdown with user list                          │
  │  3. User selects different user → handleUserChange(newUserId)            │
  │  4. getFavorites(newUserId) fetches that user's favorites                │
  │  5. All subsequent favorite operations use selected userId               │
  └──────────────────────────────────────────────────────────────────────────┘

  READ FAVORITES (on page load or user switch)
  ────────────────────────────────────────────
  ┌──────────┐  getFavorites(userId)  ┌───────────────────┐  GET /api/favorites   ┌──────────┐
  │  Browser │ ──────────────────────►│  actions/         │  X-User-Id: {userId}  │  Express │
  │  page.tsx│                        │  favorites.ts     │ ───────────────────►  │  Backend │
  │          │◄────────────────────── │                   │◄───────────────────   │          │
  └──────────┘  number[]              └───────────────────┘  { jobIds: [...] }    └──────────┘

  TOGGLE FAVORITE (optimistic update)
  ────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  JobsPage.tsx: handleToggleFavorite(jobId)                               │
  │                                                                          │
  │  1. Update local state immediately (optimistic)                          │
  │  2. Call toggleFavorite(jobId, isFavorited, userId) server action        │
  │  3. If fails → rollback local state + show error                         │
  └──────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐  toggleFavorite()  ┌───────────────────┐  POST/DELETE          ┌──────────┐
  │  Browser │ ──────────────────►│  actions/         │  X-User-Id: {userId}  │  Express │
  │  Client  │                    │  favorites.ts     │ ───────────────────►  │  Backend │
  │          │◄────────────────── │                   │◄───────────────────   │          │
  └──────────┘  {success, error}  └───────────────────┘  {data, error}        └──────────┘
                                                                                    │
                                                                                    ▼
                                                               ┌────────────────────────┐
                                                               │  SQLite                │
                                                               │  INSERT/DELETE favorite│
                                                               │  (userId, jobId)       │
                                                               └────────────────────────┘

  FAVORITES ONLY FILTER
  ─────────────────────
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  When "Favorites only" checkbox enabled:                                 │
  │                                                                          │
  │  1. Cache current paginated jobs                                         │
  │  2. Call getJobsByIds(Array.from(favorites))                             │
  │  3. Fetch each favorite job from AWS API                                 │
  │  4. Display all favorites (no pagination)                                │
  │                                                                          │
  │  When disabled: restore cached paginated view                            │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Backend Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              backend/                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ROUTES (HTTP Layer)                                                │   │
│   │  - Parse request params/body                                        │   │
│   │  - Read X-User-Id header for user context                           │   │
│   │  - Format HTTP response { data: ..., error: {} }                    │   │
│   │                                                                     │   │
│   │  routes/users.ts       routes/favorites.ts                          │   │
│   └──────────────┬────────────────────────┬─────────────────────────────┘   │
│                  │                        │                                 │
│                  ▼                        ▼                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  SERVICES (Business Logic)                                          │   │
│   │  - Orchestrate operations                                           │   │
│   │  - Apply business rules                                             │   │
│   │                                                                     │   │
│   │  services/favoritesService.ts                                       │   │
│   │  - getFavorites(userId)                                             │   │
│   │  - getFavoriteJobIds(userId)                                        │   │
│   │  - addFavorite(jobId, userId)                                       │   │
│   │  - removeFavorite(jobId, userId)                                    │   │
│   └─────────────────────────────────────┬───────────────────────────────┘   │
│                                         │                                   │
│                                         ▼                                   │
│                              ┌─────────────────────────────────────────┐    │
│                              │  REPOSITORIES (Data Access)             │    │
│                              │  - Raw database queries                  │    │
│                              │  - No business logic                     │    │
│                              │                                          │    │
│                              │  repositories/favoritesRepository.ts     │    │
│                              │  - getByUserId(userId)                   │    │
│                              │  - exists(userId, jobId)                 │    │
│                              │  - create(userId, jobId)                 │    │
│                              │  - delete(userId, jobId)                 │    │
│                              └──────────────┬───────────────────────────┘    │
│                                              │                              │
│                                              ▼                              │
│                               ┌──────────────────────────┐                  │
│                               │  SQLite (db/starred.db)  │                  │
│                               │                          │                  │
│                               │  Tables:                 │                  │
│                               │  - user                  │                  │
│                               │  - favorite              │                  │
│                               └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Frontend Component Tree

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  page.tsx (Server Component)                                                 │
│  └── JobsPage.tsx (Client Component)                                        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  <header>                                                           │   │
│   │    "Find Your Next Role"              <UserIndicator />             │   │
│   │                                       └── User switcher dropdown    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  <InputText>                                    <Checkbox>          │   │
│   │    ┌──────────┐                    ┌─────────┐  "Favorites only"    │   │
│   │    │ Spinner/ │  [Search...]       │ Clear X │                      │   │
│   │    │ Search   │                    └─────────┘                      │   │
│   │    └──────────┘                                                     │   │
│   │    useDebounce(500ms) ──► searchJobs()                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  {jobs.map(job => <JobCard />)}                                     │   │
│   │                                                                     │   │
│   │  ┌─────────────────────────────────────────────────────────────┐   │   │
│   │  │  <JobCard>                                                  │   │   │
│   │  │    ┌──────────────────────────────────┬─────────────────┐   │   │   │
│   │  │    │  Ruby on Rails Developer         │    ┌─────────┐  │   │   │   │
│   │  │    │  CodeCrafters Inc.               │    │ ★ Star  │  │   │   │   │
│   │  │    │                                  │    │  Icon   │  │   │   │   │
│   │  │    │  As a Ruby on Rails Developer... │    └─────────┘  │   │   │   │
│   │  │    └──────────────────────────────────┴─────────────────┘   │   │   │
│   │  │                                                             │   │   │
│   │  │    onToggleFavorite ──► toggleFavorite(jobId, userId)       │   │   │
│   │  └─────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  <Pagination>                                                       │   │
│   │    ┌────────┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌────────┐             │   │
│   │    │  Prev  │ │ 1 │ │ 2 │ │ 3 │ │...│ │10 │ │  Next  │             │   │
│   │    └────────┘ └───┘ └───┘ └───┘ └───┘ └───┘ └────────┘             │   │
│   │                                                                     │   │
│   │    onPageChange ──► handlePageChange(page)                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            db/starred.db                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐       ┌─────────────────────────────────┐    │
│   │         user            │       │           favorite              │    │
│   ├─────────────────────────┤       ├─────────────────────────────────┤    │
│   │ id          INTEGER PK  │──┐    │ id          INTEGER PK          │    │
│   │ firstName   TEXT        │  │    │ userId      INTEGER FK ─────────┼────┤
│   │ lastName    TEXT        │  │    │ jobId       INTEGER             │    │
│   │ email       TEXT UNIQUE │  └───►│ createdAt   TEXT                │    │
│   │ createdAt   TEXT        │       │                                 │    │
│   └─────────────────────────┘       │ UNIQUE(userId, jobId)           │    │
│                                     └─────────────────────────────────┘    │
│                                                                             │
│   Note: User switcher dropdown allows impersonating any user (no auth)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND ENDPOINTS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USERS                                                                      │
│  ─────                                                                      │
│  GET  /users                  → List all users (id, firstName, lastName)    │
│                                                                             │
│  FAVORITES (all require X-User-Id header)                                   │
│  ─────────                                                                  │
│  GET    /api/favorites        → Get favorite job IDs for user              │
│  POST   /api/favorites        → Add favorite { jobId: 123 }                 │
│  DELETE /api/favorites/:jobId → Remove favorite                             │
│                                                                             │
│  Response Format:                                                           │
│  { data: { ... }, error: {} }                                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                     EXTERNAL AWS API (called from Next.js)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GET  /jobs?page=1            → List jobs (paginated)                       │
│  GET  /jobs/:id               → Get single job                              │
│  POST /jobs/recommendations   → Search { jobTitle: "..." } → jobIds[]      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Backend (Express)                          Frontend (Next.js)              │
│  ─────────────────                          ──────────────────              │
│                                                                             │
│  ┌─────────────────────┐                    ┌─────────────────────────┐    │
│  │  Route Handler      │                    │  Server Action          │    │
│  │  throws AppError    │───── HTTP ────────►│  parseApiError()        │    │
│  └──────────┬──────────┘                    └───────────┬─────────────┘    │
│             │                                           │                   │
│             ▼                                           ▼                   │
│  ┌─────────────────────┐                    ┌─────────────────────────┐    │
│  │  errorHandler       │                    │  ActionResult<T>        │    │
│  │  middleware         │                    │  { success, data/error }│    │
│  └──────────┬──────────┘                    └───────────┬─────────────┘    │
│             │                                           │                   │
│             ▼                                           ▼                   │
│  ┌─────────────────────┐                    ┌─────────────────────────┐    │
│  │  { error, code }    │                    │  JobsPage.tsx           │    │
│  │  JSON response      │                    │  error state + ErrorAlert│    │
│  └─────────────────────┘                    └─────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  BACKEND ERROR CLASSES (errors/AppError.ts)
  ──────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  AppError (base class)                                                  │
  │  ├── ValidationError   → 400  (invalid input, missing fields)          │
  │  ├── NotFoundError     → 404  (resource not found)                     │
  │  └── DatabaseError     → 500  (SQLite errors)                          │
  │                                                                         │
  │  Usage in routes:                                                       │
  │    throw new ValidationError('Job ID is required')                      │
  │    throw new NotFoundError('Favorite not found')                        │
  └─────────────────────────────────────────────────────────────────────────┘

  ERROR RESPONSE FORMAT
  ─────────────────────
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Success: { data: { ... }, error: {} }                                  │
  │  Error:   { error: "User-friendly message", code: "error_type" }        │
  │                                                                         │
  │  Error codes:                                                           │
  │    validation_error   - Invalid input                                   │
  │    not_found          - Resource doesn't exist                          │
  │    database_error     - Database operation failed                       │
  │    constraint_error   - SQLite constraint violation                     │
  │    internal_error     - Unexpected server error                         │
  └─────────────────────────────────────────────────────────────────────────┘

  FRONTEND ERROR HANDLING
  ───────────────────────
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ActionResult<T> (types/index.ts)                                       │
  │  ─────────────────────────────────                                      │
  │  type ActionResult<T> =                                                 │
  │    | { success: true; data: T }                                         │
  │    | { success: false; error: { message: string; code?: string } }      │
  │                                                                         │
  │  All server actions return ActionResult<T> for explicit error handling  │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ErrorAlert Component (components/ErrorAlert.tsx)                       │
  │  ─────────────────────────────────────────────────                      │
  │  Props:                                                                 │
  │    message: string       - Error message to display                     │
  │    onDismiss?: () => void - Optional dismiss callback                   │
  │    variant: 'banner' | 'inline'                                         │
  │                                                                         │
  │  Renders dismissible error banner with red styling                      │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  JobsPage.tsx Error State                                               │
  │  ─────────────────────────                                              │
  │  Single error state: const [error, setError] = useState<string | null>  │
  │                                                                         │
  │  Error sources:                                                         │
  │    • getJobs() failure      → setError(result.error.message)           │
  │    • searchJobs() failure   → setError(result.error.message)           │
  │    • toggleFavorite() fail  → rollback + setError(result.error.message)│
  │    • getFavorites() failure → setError(result.error.message)           │
  └─────────────────────────────────────────────────────────────────────────┘
```

## Docker Compose Setup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           docker-compose.yml                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  services:                                                                  │
│    backend:                                                                 │
│      - Dockerfile.backend (Node 20 Alpine + tsx)                            │
│      - Port 3001                                                            │
│      - Volumes: ./backend, ./db (SQLite persistence)                        │
│                                                                             │
│    frontend:                                                                │
│      - Dockerfile (Node 20 Alpine + Next.js)                                │
│      - Port 4000                                                            │
│      - Environment: BACKEND_URL=http://backend:3001                         │
│      - Volumes: ./front-end:/app (hot reload)                               │
│      - depends_on: backend                                                  │
│                                                                             │
│  Commands:                                                                  │
│    docker compose up        # Start both services                           │
│    docker compose down -v   # Stop + remove volumes                         │
│    docker compose logs -f   # Follow logs                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
starred-case/
├── backend/
│   ├── bin/www.ts                 # Server entry point
│   ├── app.ts                     # Express config + middleware
│   ├── errors/
│   │   └── AppError.ts            # Custom error classes
│   ├── middleware/
│   │   └── errorHandler.ts        # Central error handling
│   ├── routes/
│   │   ├── favorites.ts           # /api/favorites endpoints
│   │   └── users.ts               # /users endpoints
│   ├── services/
│   │   └── favoritesService.ts    # Favorites business logic
│   ├── repositories/
│   │   └── favoritesRepository.ts # Database queries
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── tsconfig.json
├── db/
│   ├── db.js                      # SQLite connection
│   ├── schema.sql                 # Table definitions
│   ├── seed.js                    # Faker-based seeding
│   └── starred.db                 # SQLite database file
├── front-end/
│   ├── app/
│   │   ├── page.tsx               # Server component (data fetching)
│   │   ├── layout.tsx             # Root layout
│   │   ├── JobsPage.tsx           # Client component (interactivity)
│   │   ├── globals.css            # Tailwind v4 + design system
│   │   ├── actions/
│   │   │   ├── jobs.ts            # AWS API server actions
│   │   │   ├── favorites.ts       # Express backend server actions
│   │   │   └── users.ts           # Users server action
│   │   ├── components/
│   │   │   ├── JobCard.tsx        # Job display card
│   │   │   ├── Pagination.tsx     # Page navigation
│   │   │   ├── UserIndicator.tsx  # User switcher dropdown
│   │   │   ├── Button.tsx         # Reusable button
│   │   │   ├── InputText.tsx      # Text input with slots
│   │   │   ├── Checkbox.tsx       # Checkbox component
│   │   │   ├── ErrorAlert.tsx     # Error display component
│   │   │   └── icons/
│   │   │       ├── SearchIcon.tsx
│   │   │       ├── ClearIcon.tsx
│   │   │       ├── StarIcon.tsx
│   │   │       └── Spinner.tsx
│   │   ├── hooks/
│   │   │   └── useDebounce.ts     # Debounce hook for search
│   │   ├── lib/
│   │   │   ├── serializers.ts     # snake_case → camelCase
│   │   │   └── errorUtils.ts      # API error parsing
│   │   └── types/
│   │       └── index.ts           # TypeScript interfaces
│   ├── Dockerfile
│   └── docker-entrypoint.sh
├── docker-compose.yml             # Docker orchestration
├── Dockerfile.backend             # Backend container
└── architecture.md                # This document
```
