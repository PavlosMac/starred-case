import express from 'express'
import type { Request, Response } from 'express'
import { favoritesService } from '../services/favoritesService'

const router = express.Router()

const DEFAULT_USER_ID = 1

function getUserId(req: Request): number {
  const header = req.headers['x-user-id']
  if (header && typeof header === 'string') {
    const parsed = parseInt(header, 10)
    if (!isNaN(parsed)) return parsed
  }
  return DEFAULT_USER_ID
}

/**
 * GET /api/favorites
 * Get all favorited job IDs for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const jobIds = await favoritesService.getFavoriteJobIds(userId)

    res.json({
      data: { jobIds },
      error: {},
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch favorites'
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/favorites
 * Add a job to favorites
 * Body: { jobId: number }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { jobId } = req.body

    if (!jobId || typeof jobId !== 'number') {
      return res.status(400).json({ error: 'jobId is required and must be a number' })
    }

    const favorite = await favoritesService.addFavorite(jobId, userId)

    res.status(201).json({
      data: favorite,
      error: {},
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add favorite'
    res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/favorites/:jobId
 * Remove a job from favorites
 */
router.delete('/:jobId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const jobId = parseInt(req.params.jobId)

    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' })
    }

    const deleted = await favoritesService.removeFavorite(jobId, userId)

    if (!deleted) {
      return res.status(404).json({ error: 'Favorite not found' })
    }

    res.json({
      data: { deleted: true },
      error: {},
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove favorite'
    res.status(500).json({ error: message })
  }
})

export default router
