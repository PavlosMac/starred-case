import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import { favoritesService } from '../services/favoritesService'
import { ValidationError, NotFoundError } from '../errors/AppError'

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
 * Async handler wrapper to forward errors to Express error middleware
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

/**
 * GET /api/favorites
 * Get all favorited job IDs for the current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const jobIds = await favoritesService.getFavoriteJobIds(userId)

    res.json({
      data: { jobIds },
    })
  })
)

/**
 * POST /api/favorites
 * Add a job to favorites
 * Body: { jobId: number }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const { jobId } = req.body

    if (!jobId || typeof jobId !== 'number') {
      throw new ValidationError('jobId is required and must be a number')
    }

    const favorite = await favoritesService.addFavorite(jobId, userId)

    res.status(201).json({
      data: favorite,
    })
  })
)

/**
 * DELETE /api/favorites/:jobId
 * Remove a job from favorites
 */
router.delete(
  '/:jobId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const jobIdParam = req.params.jobId as string
    const jobId = parseInt(jobIdParam, 10)

    if (isNaN(jobId)) {
      throw new ValidationError('Invalid job ID')
    }

    const deleted = await favoritesService.removeFavorite(jobId, userId)

    if (!deleted) {
      throw new NotFoundError('Favorite not found')
    }

    res.json({
      data: { deleted: true },
    })
  })
)

export default router
