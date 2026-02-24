# Starred Case - Job Search Application

## Overview

A candidate-centric job search application where users can browse job opportunities, search by title, and favorite jobs. Built as a coding case study with Next.js frontend and Express.js backend.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Express.js 4.21 (TypeScript, ES6 modules)
- **Database**: SQLite3 (file-based at `db/starred.db`)
- **External API**: Jobs API at `https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod`

## Development Commands

```bash
# Setup
npm install
cd front-end && npm install && cd ..
npm run db:reset          # Reset and seed SQLite database

# Backend (port 3001)
npm run server:dev        # Start Express with --watch
npm run server:start      # Start Express (production)

# Frontend (port 4000)
npm run client:dev        # Start Next.js dev server
npm run client:build      # Build for production
npm run client:start      # Start production server

# Docker
npm run docker            # Run full stack with docker-compose

# Linting & Formatting
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run format            # Format with Prettier
```

## Architecture

**Dual-server monorepo:**

- Frontend (Next.js) runs on port 4000
- Backend (Express) runs on port 3001 with CORS enabled
- SQLite database in `db/` directory
- Docker Compose for containerized development

```
starred-case/
├── front-end/                 # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx         # Root layout (fonts, container)
│   │   ├── page.tsx           # Server component (data fetching)
│   │   ├── JobsPage.tsx       # Client component (interactivity)
│   │   ├── globals.css        # Tailwind v4 config + design system
│   │   ├── actions/           # Server actions
│   │   │   ├── jobs.ts        # AWS API calls
│   │   │   └── favorites.ts   # Express backend calls
│   │   ├── components/        # React components
│   │   ├── types/             # TypeScript interfaces
│   │   └── lib/               # Utilities (serializers)
│   ├── Dockerfile
│   └── package.json
├── backend/                   # Express API
│   ├── app.ts                 # Express config + middleware
│   ├── bin/www.ts             # Server entry (port 3001)
│   ├── routes/                # Route handlers
│   ├── services/              # Business logic
│   ├── repositories/          # Data access layer
│   └── types/                 # TypeScript interfaces
├── db/                        # Database layer
│   ├── db.js                  # SQLite connection (singleton)
│   ├── schema.sql             # DDL statements
│   └── seed.js                # Faker-based seeding
├── docker-compose.yml
└── Dockerfile.backend
```

## External Jobs API

```bash
# List jobs (paginated)
GET https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs?page=<number>

# Get job by ID
GET https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs/<id>

# Search recommendations
POST https://yon9jygrt9.execute-api.eu-west-1.amazonaws.com/prod/jobs/recommendations
Content-Type: application/json
{"jobTitle": "<query>"}
```

Returns `{error: "..."}` on 4xx errors.

## Conventions

**Frontend (React/TypeScript):**

- Components: PascalCase files (`.tsx`)
- Server Actions in `app/actions/` for API calls
- Serializers in `app/lib/` for snake_case → camelCase conversion
- Styling: Tailwind v4 utility classes (CSS-based config in `globals.css`)

**Backend (Node.js/TypeScript):**

- ES6 modules with `import`/`export`
- Routes organized by resource in `backend/routes/`
- Services for business logic, repositories for data access
- JSON responses: `{data: ..., error: {}}`
- Hardcoded `DEFAULT_USER_ID = 1` (no auth, impersonating user)

**Code Style (ESLint + Prettier):**

- No semicolons
- Single quotes
- 2 space indent
- Prefix unused parameters with `_`

**Design System (Tailwind v4):**

- Colors defined in `front-end/app/globals.css` using `@theme` directive
- Brand colors: `brand-primary-*`, `brand-base-*`, `brand-success-*`
- Font: Roboto Flex (loaded from Google Fonts)

## Key Files

- `front-end/app/actions/jobs.ts` - Server actions for AWS API
- `front-end/app/actions/favorites.ts` - Server actions for Express backend
- `front-end/app/lib/serializers.ts` - API response transformation
- `front-end/app/components/Button.tsx` - Button with 13+ variants
- `front-end/app/globals.css` - Tailwind v4 design system config
- `backend/services/jobsService.ts` - Jobs business logic
- `backend/services/favoritesService.ts` - Favorites business logic
- `db/db.js` - SQLite connection module
