CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  principal TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  credits_remaining INTEGER DEFAULT 0,
  preferences TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  last_sign_in TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT DEFAULT '',
  code TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_generations (
  project_id INTEGER NOT NULL,
  generation_id INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (generation_id) REFERENCES generations(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, generation_id)
);

CREATE TABLE IF NOT EXISTS auth_keys (
  key TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT DEFAULT 'default',
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_auth_keys_user ON auth_keys(user_id);
