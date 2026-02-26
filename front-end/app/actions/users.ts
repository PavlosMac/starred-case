'use server'

import type { ActionResult } from '../types'

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function getUsers(): Promise<ActionResult<User[]>> {
  try {
    const response = await fetch(`${BACKEND_URL}/users`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch users:', response.statusText)
      return {
        success: false,
        error: { message: 'Failed to load users.', code: 'fetch_error' },
      }
    }

    const data = await response.json()
    return { success: true, data: data.data || [] }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return {
      success: false,
      error: { message: 'Network error. Please check your connection.', code: 'network_error' },
    }
  }
}
