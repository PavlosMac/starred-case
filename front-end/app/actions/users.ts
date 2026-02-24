'use server'

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/users`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch users:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}
