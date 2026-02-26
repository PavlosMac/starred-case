import type { Favorite } from '../types'
import { DatabaseError } from '../errors/AppError'
// @ts-expect-error - db.js is not typed
import db from '../../db/db.js'

interface DbRunResult {
  lastID: number
  changes: number
}

export class FavoritesRepository {
  /**
   * Get all favorites for a user
   */
  async getByUserId(userId: number): Promise<Favorite[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM favorite WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (error: Error | null, rows: Favorite[]) => {
          if (error) {
            reject(new DatabaseError(`Failed to fetch favorites: ${error.message}`))
          } else {
            resolve(rows)
          }
        }
      )
    })
  }

  /**
   * Check if a job is favorited by a user
   */
  async exists(userId: number, jobId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM favorite WHERE userId = ? AND jobId = ?',
        [userId, jobId],
        (error: Error | null, row: Favorite | undefined) => {
          if (error) {
            reject(new DatabaseError(`Failed to check favorite: ${error.message}`))
          } else {
            resolve(!!row)
          }
        }
      )
    })
  }

  /**
   * Add a favorite
   */
  async create(userId: number, jobId: number): Promise<Favorite> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO favorite (userId, jobId) VALUES (?, ?)',
        [userId, jobId],
        function (this: DbRunResult, error: Error | null) {
          if (error) {
            reject(new DatabaseError(`Failed to add favorite: ${error.message}`))
          } else {
            resolve({
              id: this.lastID,
              userId,
              jobId,
              createdAt: new Date().toISOString(),
            })
          }
        }
      )
    })
  }

  /**
   * Remove a favorite
   */
  async delete(userId: number, jobId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM favorite WHERE userId = ? AND jobId = ?',
        [userId, jobId],
        function (this: DbRunResult, error: Error | null) {
          if (error) {
            reject(new DatabaseError(`Failed to remove favorite: ${error.message}`))
          } else {
            resolve(this.changes > 0)
          }
        }
      )
    })
  }
}

// Export singleton instance
export const favoritesRepository = new FavoritesRepository()
