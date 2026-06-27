-- DipDesigns · D1 migration 0003 — per-user saved palettes ("My Palettes" / design history)
-- Apply: wrangler d1 migrations apply dipdesigns-db   (--remote for prod)
CREATE TABLE IF NOT EXISTS user_palettes (
  id TEXT PRIMARY KEY,
  principal TEXT NOT NULL,            -- SHA-256 auth hash (same as ledger/auth)
  name TEXT,
  base_hex TEXT, primary_hex TEXT, accent_hex TEXT, surface_hex TEXT,
  source TEXT,                        -- 'image' | 'manual' | 'preset'
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_user_palettes ON user_palettes(principal, created_at);
