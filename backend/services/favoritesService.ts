import type { Favorite } from '../types'
import { favoritesRepository } from '../repositories/favoritesRepository'

// Hardcoded user ID (no auth implemented)
const DEFAULT_USER_ID = 1

export class FavoritesService {
  /**
   * Get all favorites for the current user
   */
  async getFavorites(userId: number = DEFAULT_USER_ID): Promise<Favorite[]> {
    return favoritesRepository.getByUserId(userId)
  }

  /**
   * Get just the job IDs that are favorited
   */
  async getFavoriteJobIds(userId: number = DEFAULT_USER_ID): Promise<number[]> {
    const favorites = await favoritesRepository.getByUserId(userId)
    return favorites.map((f) => f.jobId)
  }

  /**
   * Check if a job is favorited
   */
  async isFavorited(jobId: number, userId: number = DEFAULT_USER_ID): Promise<boolean> {
    return favoritesRepository.exists(userId, jobId)
  }

  /**
   * Add a job to favorites
   */
  async addFavorite(jobId: number, userId: number = DEFAULT_USER_ID): Promise<Favorite> {
    return favoritesRepository.create(userId, jobId)
  }

  /**
   * Remove a job from favorites
   */
  async removeFavorite(jobId: number, userId: number = DEFAULT_USER_ID): Promise<boolean> {
    return favoritesRepository.delete(userId, jobId)
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService()
