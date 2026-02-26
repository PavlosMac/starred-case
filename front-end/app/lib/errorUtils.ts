/**
 * Parse error response from backend API
 * Backend returns { error: string, code?: string }
 */
export async function parseApiError(response: Response): Promise<{
  message: string
  code?: string
}> {
  try {
    const data = await response.json()

    // New format { error, code }
    if (data.error && typeof data.error === 'string') {
      return { message: data.error, code: data.code }
    }

    return { message: `Request failed with status ${response.status}` }
  } catch {
    return { message: `Request failed with status ${response.status}` }
  }
}
