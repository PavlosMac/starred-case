import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sqlite3 from 'sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createDBConnection() {
  const db = new sqlite3.Database(path.resolve(__dirname, 'starred.db'), (error) => {
    if (error) {
      return console.error(error.message)
    }
  })
  console.log('Connection with SQLite has been established')
  return db
}

export default createDBConnection()
