/**
 * Base application error class
 * All custom errors extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly type: string
  public readonly title: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    type: string = 'internal_error',
    title: string = 'Internal Server Error'
  ) {
    super(message)
    this.statusCode = statusCode
    this.type = type
    this.title = title
    this.isOperational = true

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400)
 * Use for invalid input, missing required fields, etc.
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'validation_error', 'Validation Failed')
  }
}

/**
 * Not found error (404)
 * Use when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'not_found', 'Resource Not Found')
  }
}

/**
 * Database error (500)
 * Use for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'database_error', 'Database Error')
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
