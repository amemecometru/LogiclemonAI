-- DipDesigns · D1 migration 0002 — Inspiration page
-- Apply: wrangler d1 migrations apply dipdesigns-db   (or --remote)
-- Idempotent: safe to re-run. Seeds categories + the two locked palettes +
-- representative items. Extend inspiration_items as the elevated thumbnails land.

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE, name TEXT, blurb TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS palettes (
  id TEXT PRIMARY KEY, name TEXT, source_image TEXT,
  base_hex TEXT, primary_hex TEXT, accent_hex TEXT, surface_hex TEXT,
  roles_json TEXT, created_at INTEGER
);
CREATE TABLE IF NOT EXISTS inspiration_items (
  id TEXT PRIMARY KEY, category_id TEXT, title TEXT, blurb TEXT, description TEXT,
  type_direction TEXT, palette_id TEXT, stack TEXT,          -- 'nobreak' | 'tailwind' | 'any'
  thumb_asset TEXT, seed_prompt TEXT, featured INTEGER DEFAULT 0,
  uses INTEGER DEFAULT 0, created_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE TABLE IF NOT EXISTS user_favorites (
  principal TEXT, item_id TEXT, created_at INTEGER, PRIMARY KEY (principal, item_id)
);
CREATE TABLE IF NOT EXISTS brief_log (
  id TEXT PRIMARY KEY, principal TEXT, item_id TEXT, brief_md TEXT, created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_items_cat      ON inspiration_items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_featured ON inspiration_items(featured);
CREATE INDEX IF NOT EXISTS idx_fav_principal  ON user_favorites(principal);

-- ---- categories ----
INSERT OR IGNORE INTO categories (id, slug, name, blurb, sort) VALUES
 ('business-landing','business-landing','Business Landing Pages','Conversion-ready sites for real industries',1),
 ('resume','resume','Résumé Builder','Single-page résumés with real hierarchy',2),
 ('social','social','Social Media Studio','On-spec banners for every platform',3),
 ('type-direction','type-direction','Type Directions','Opinionated typographic moods',4),
 ('color-story','color-story','Color Stories','Named palettes, real tokens',5),
 ('illustrated','illustrated','Illustrated / Artistic','Hand-crafted looks, not flat corporate',6);

-- ---- palettes (extracted via the geode -> paint-chip engine) ----
INSERT OR IGNORE INTO palettes (id,name,source_image,base_hex,primary_hex,accent_hex,surface_hex,roles_json,created_at) VALUES
 ('amethyst-dusk','Amethyst Dusk','/inspo/palette-amethyst-dusk.webp','#1F1512','#AE6146','#732E5B','#F0E3DF',
   '{"BASE":"#1F1512","PRIMARY":"#AE6146","ACCENT":"#732E5B","SURFACE":"#F0E3DF"}', CAST(strftime('%s','now') AS INTEGER)*1000),
 ('mineral-cosmos','Mineral Cosmos','/inspo/palette-mineral-cosmos.webp','#12171F','#2E4B73','#572E73','#DFE6F0',
   '{"BASE":"#12171F","PRIMARY":"#2E4B73","ACCENT":"#572E73","SURFACE":"#DFE6F0"}', CAST(strftime('%s','now') AS INTEGER)*1000);

-- ---- representative items (extend with the rest as thumbnails are elevated) ----
INSERT OR IGNORE INTO inspiration_items
 (id,category_id,title,blurb,description,type_direction,palette_id,stack,thumb_asset,seed_prompt,featured,created_at) VALUES
 ('biz-saas-northbeam','business-landing','SaaS Analytics Landing',
  'Indigo hero, product shot, pricing — the modern B2B SaaS pattern.',
  'A conversion-focused SaaS landing: hero with value prop + dual CTA, product dashboard preview, logo strip, 3-up feature grid, pricing teaser, FAQ, footer.',
  'swiss-neue','mineral-cosmos','any','/inspo/saas-northbeam.webp',
  'Build a modern B2B SaaS analytics landing page. Hero: bold headline, one-line subhead, primary CTA "Start free" + ghost "Book a demo", and a product dashboard preview with charts on the right. Below: a logo strip, a 3-column feature grid with icons, a 3-tier pricing teaser with a monthly/annual toggle, a short FAQ accordion, and a footer. Clean Inter-style type, generous whitespace, soft shadows, indigo primary. Realistic copy, fully responsive, no lorem ipsum.',1,
  CAST(strftime('%s','now') AS INTEGER)*1000),
 ('resume-modern','resume','Modern Professional Résumé',
  'Two-column, strong hierarchy, one accent — ATS-friendly.',
  'Single-page résumé: header with name + title, left column (contact, skills, education), right column (experience with concise bullets). One accent color for section heads.',
  'haute-serif','amethyst-dusk','nobreak','/inspo/resume-modern.webp',
  'Build a clean single-page professional résumé. Header with name and title; narrow left column for contact, skills, education; wider right column for work experience with concise bullet points; one tasteful accent color for section headings; strong typographic hierarchy; print-friendly; single self-contained file, no dependencies.',1,
  CAST(strftime('%s','now') AS INTEGER)*1000),
 ('social-kit','social','Social Media Brand Kit',
  'One brand, every platform — banners at the correct sizes.',
  'Pick a platform/format and open the Studio on a fixed-size canvas (see social presets) with the AI design assistant. Backend persistence is a later build.',
  'liquid-chrome','citrus-pop','any','/inspo/social-kit.webp',
  'Design a cohesive social media banner set for one brand across YouTube, X, Facebook, LinkedIn and TikTok using a shared logomark, palette and type. Output one canvas at a time at the selected platform size.',1,
  CAST(strftime('%s','now') AS INTEGER)*1000);
