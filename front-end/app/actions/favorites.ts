'use server'

import { revalidatePath } from 'next/cache'
import type { ActionResult } from '../types'
import { parseApiError } from '../lib/errorUtils'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function getFavorites(userId: number = 1): Promise<ActionResult<number[]>> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites`, {
      cache: 'no-store',
      headers: {
        'X-User-Id': String(userId),
      },
    })

    if (!response.ok) {
      const error = await parseApiError(response)
      console.error('Failed to fetch favorites:', error.message)
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, data: data.data?.jobIds || [] }
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return {
      success: false,
      error: { message: 'Network error. Please check your connection.', code: 'network_error' },
    }
  }
}

export async function addFavorite(
  jobId: number,
  userId: number = 1
): Promise<ActionResult<void>> {
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
      const error = await parseApiError(response)
      return { success: false, error }
    }

    revalidatePath('/')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to add favorite:', error)
    return {
      success: false,
      error: { message: 'Network error. Please try again.', code: 'network_error' },
    }
  }
}

export async function removeFavorite(
  jobId: number,
  userId: number = 1
): Promise<ActionResult<void>> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/favorites/${jobId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': String(userId),
      },
    })

    if (!response.ok) {
      const error = await parseApiError(response)
      return { success: false, error }
    }

    revalidatePath('/')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    return {
      success: false,
      error: { message: 'Network error. Please try again.', code: 'network_error' },
    }
  }
}

export async function toggleFavorite(
  jobId: number,
  currentlyFavorited: boolean,
  userId: number = 1
): Promise<ActionResult<void>> {
  if (currentlyFavorited) {
    return removeFavorite(jobId, userId)
  } else {
    return addFavorite(jobId, userId)
  }
}
