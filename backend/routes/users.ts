import express from 'express'
import type { Request, Response } from 'express'
// @ts-expect-error - db.js is not typed
import db from '../../db/db.js'

const router = express.Router()

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  salt: string
}

router.get('/', (_req: Request, res: Response) => {
  db.all(
    'SELECT id, firstName, lastName, email FROM user',
    (error: Error | null, rows: Omit<User, 'password' | 'salt'>[]) => {
      if (error) {
        return res.status(400).json({ error: error.message })
      }

      res.json({
        data: rows,
        error: {},
      })
    }
  )
})

export default router
