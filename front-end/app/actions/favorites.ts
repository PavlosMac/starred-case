'use server'

import { revalidatePath } from 'next/cache'
import type { FavoritesResponse } from '../types'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function getFavorites(userId: number = 1): Promise<number[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites`, {
      cache: 'no-store',
      headers: {
        'X-User-Id': String(userId),
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch favorites:', response.statusText)
      return []
    }

    const data: FavoritesResponse = await response.json()
    return data.data?.jobIds || []
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return []
  }
}

export async function addFavorite(
  jobId: number,
  userId: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': String(userId),
      },
      body: JSON.stringify({ jobId }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to add favorite' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to add favorite:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function removeFavorite(
  jobId: number,
  userId: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites/${jobId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': String(userId),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || 'Failed to remove favorite',
      }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function toggleFavorite(
  jobId: number,
  currentlyFavorited: boolean,
  userId: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (currentlyFavorited) {
    return removeFavorite(jobId, userId)
  } else {
    return addFavorite(jobId, userId)
  }
}
