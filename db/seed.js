import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { faker } from '@faker-js/faker'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function generateUsers(num) {
  const users = []
  for (let i = 0; i <= num; i++) {
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      salt: faker.lorem.word(),
    })
  }
  return users
}

function reset() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql')).toString()
  db.exec(sql)
  seed()
  console.log('Database has been reset and seeded')
}

function seed() {
  const users = generateUsers(10)
  const stmt = db.prepare(
    'INSERT INTO user (firstName, lastName, email, password, salt) VALUES (?, ?, ?, ?, ?)'
  )
  users.forEach((user) => {
    stmt.run(user.firstName, user.lastName, user.email, user.password, user.salt)
  })
  stmt.finalize()
  db.close()
}

reset()
