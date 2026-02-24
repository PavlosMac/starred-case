import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import usersRouter from './routes/users'
import favoritesRouter from './routes/favorites'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

app.use('/users', usersRouter)
app.use('/api/favorites', favoritesRouter)

// catch 404 and forward to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createError(404))
})

// error handler
app.use((err: createError.HttpError, req: Request, res: Response, _next: NextFunction) => {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500)
  res.json({ error: err.message })
})

export default app
