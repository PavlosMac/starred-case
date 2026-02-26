import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import usersRouter from './routes/users'
import favoritesRouter from './routes/favorites'
import { errorHandler } from './middleware/errorHandler'
import { NotFoundError } from './errors/AppError'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

app.use('/users', usersRouter)
app.use('/api/favorites', favoritesRouter)

// Catch 404 and forward to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('Route not found'))
})

// Central error handler
app.use(errorHandler)

export default app
