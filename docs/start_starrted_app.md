# Quick Start

## Run with Docker

```bash
docker compose up --build   # Build and start (frontend: 4000, backend: 3001)
docker compose down         # Stop
```

## Acceptance Criteria

| # | Test | Steps |
|---|------|-------|
| 1 | User impersonation | Select different user from dropdown in header |
| 2 | View jobs | Jobs display on page load with title, company, description |
| 3 | Paginate jobs | Click page numbers to navigate between pages |
| 4 | Favorite a job | Click star icon on job card, star fills in |
| 5 | View favorites only | Check "Favorites only" checkbox, only starred jobs shown |
| 6 | Switch user favorites | Switch user via dropdown, favorites change to that user's |
| 7 | Search by title | Type in search box (min 2 chars), results filter by title |
| 8 | Clear search | Click X in search box, returns to paginated view |
