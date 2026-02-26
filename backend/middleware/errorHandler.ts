import type { Request, Response, NextFunction } from 'express'
import { AppError, isAppError } from '../errors/AppError'

/**
 * Central error handling middleware
 * Returns simple { error, code? } format
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  console.error('Error:', err.message)
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  // Determine error details
  let statusCode = 500
  let message = 'An unexpected error occurred. Please try again.'
  let code = 'internal_error'

  if (isAppError(err)) {
    statusCode = err.statusCode
    message = err.message
    code = err.type
  } else if (err.message.includes('SQLITE_CONSTRAINT')) {
    statusCode = 400
    message = 'The operation violates a database constraint.'
    code = 'constraint_error'
  } else if (err.message.includes('SQLITE_BUSY')) {
    statusCode = 503
    message = 'The database is temporarily busy. Please try again.'
    code = 'database_busy'
  }

  res.status(statusCode).json({ error: message, code })
}
