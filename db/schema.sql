DROP TABLE IF EXISTS favorite;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL
);

CREATE TABLE favorite (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  jobId INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id),
  UNIQUE(userId, jobId)
);

CREATE INDEX idx_favorite_userId ON favorite(userId);
CREATE INDEX idx_favorite_jobId ON favorite(jobId);