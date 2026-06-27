This is exactly the kind of review the working model is built for — so let me be straight with you, because most of these aren't conflicts.
7 of the 9 "conflicts" are just the net-new build the spec defines — a spec describing routes/tables/files that don't exist yet isn't in conflict with the codebase, it's the work order. Two are genuine pre-existing-state items, and one of Opencode's facts is wrong. Triage:
#	Opencode's item	Reality
1	[assets]/R2 missing	Real setup task (spec §2 anticipated it). Resolve below.
2	assets-inline.js 396KB	Not a conflict — it's why the spec says don't inline images. Keep images out and you're fine (math below).
3	D1 missing 5 tables	Net-new migration (spec §10.2). File provided below.
4	5 routes don't exist	Net-new routes (spec §10.4). File provided below.
5	assets at hyperagentassets.blob.core.windows.net	Wrong — that URL is hallucinated. Real prefix is https://hyperagent.com/api/files/usergenerated/threads/cmqs0ccv0056e06ad3h0g7kac/images/. I'll bundle the bytes (below) so you don't fetch from anywhere.
6	no social-presets.js	Net-new file. Provided below.
7	no No-Break toggle	Net-new feature (spec §9). Next batch.
8	no palette engine	Net-new feature (spec §7). Next batch (JS port of palette.py).
9	studio doesn't read ?brief=	Net-new ingestion (spec §8.1, ?prompt= stays as fallback). Next batch.
Good catch on OAuth (#aligned) — even better, it already points at /inspiration.html, so drop that change from the build order.
The one real decision — asset hosting (#1/#2): skip R2, it's overkill for ~20 images. But don't point [assets] at ./assets — that dir is your inlined HTML/JS and you'd get double-serving drift. Cleanest fix:
# wrangler.toml
[assets]
directory = "./public"
Put images in worker/public/inspo/*.webp. Only /inspo/* serves statically; /, /studio, /inspiration.html, /api/* all still hit the Worker exactly as today. The 396KB bundle never grows from images, and ~20 WebPs (~50–150KB each) live outside it entirely. Conflict #2 dissolves.
Let me generate the unambiguous exact-diff files now so Opencode applies instead of interprets.
---

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
---

// DipDesigns · worker/assets/social-presets.js
// Single source of truth for the Social Media Studio canvas presets.
// Verified June 2026 dimensions. The Studio opens on { w, h } for the chosen
// preset; `safe` marks the text/logo-safe area for banners. Backend persistence
// of exported banners is a LATER build (out of scope for the Inspiration page).
export const SOCIAL_PRESETS = [
  // platform, format, pixels, ratio, optional safe area / note
  { platform: 'YouTube',  format: 'Channel Banner', w: 2560, h: 1440, ratio: '16:9',   safe: '1546x423 centered; min 2048x1152; <=6MB' },
  { platform: 'YouTube',  format: 'Profile',        w: 800,  h: 800,  ratio: '1:1',     note: 'circle crop' },
  { platform: 'X',        format: 'Header',         w: 1500, h: 500,  ratio: '3:1',     note: 'avatar overlays lower-left; keep ~60px top/bottom clear' },
  { platform: 'X',        format: 'Profile',        w: 400,  h: 400,  ratio: '1:1',     note: 'circle crop' },
  { platform: 'Facebook', format: 'Page Cover',     w: 851,  h: 315,  ratio: '~2.7:1',  note: 'mobile renders 640x360; center-safe' },
  { platform: 'Facebook', format: 'Profile',        w: 320,  h: 320,  ratio: '1:1',     note: 'circle' },
  { platform: 'Instagram',format: 'Portrait Post',  w: 1080, h: 1350, ratio: '4:5' },
  { platform: 'Instagram',format: 'Square Post',    w: 1080, h: 1080, ratio: '1:1' },
  { platform: 'Instagram',format: 'Story / Reel',   w: 1080, h: 1920, ratio: '9:16',    safe: 'reserve ~250px top / ~220px bottom for UI' },
  { platform: 'LinkedIn', format: 'Personal Banner',w: 1584, h: 396,  ratio: '4:1',     note: 'mobile shows center 1128x396' },
  { platform: 'LinkedIn', format: 'Company Cover',  w: 1128, h: 191,  ratio: '~5.9:1',  note: 'keep text centered' },
  { platform: 'TikTok',   format: 'Video / Cover',  w: 1080, h: 1920, ratio: '9:16' },
  { platform: 'TikTok',   format: 'Profile',        w: 200,  h: 200,  ratio: '1:1',     note: 'upload larger; downscales' },
  { platform: 'Twitch',   format: 'Channel Banner', w: 1200, h: 480,  ratio: '2.5:1' },
  { platform: 'Twitch',   format: 'Offline Banner', w: 1920, h: 1080, ratio: '16:9' },
  { platform: 'Pinterest',format: 'Standard Pin',   w: 1000, h: 1500, ratio: '2:3' },
];
---

// group helper for rendering the picker by platform
export function presetsByPlatform() {
  return SOCIAL_PRESETS.reduce((m, p) => ((m[p.platform] ||= []).push(p), m), {});/* ============================================================================
 * DipDesigns · Inspiration page routes — PASTE INTO worker/index.js
 * Reuses existing helpers already defined in index.js:
 *   corsHeaders(origin) · principalFromWekKey(env,key) · generateId()
 * Bindings used: env.DB (D1) · env.WEBHOOKS_KV (KV) · env.AI (Workers AI)
 * Add the switch cases at the bottom of this file into the fetch() switch.
 * All endpoints are FREE (no CreditLedger.spend) — only /api/generate spends.
 * ==========================================================================*/

const J = (obj, cors, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

async function principalFromReq(request, env) {
  const k = request.headers.get('x-api-key') || '';
  return k.startsWith('wek_') ? (await principalFromWekKey(env, k)) || '' : '';
}

// GET /api/inspiration?category=slug  — catalog from D1, KV-cached 60s, static fallback
async function handleInspiration(request, env, cors) {
  const url = new URL(request.url);
  const cat = url.searchParams.get('category') || 'all';
  const cacheKey = 'insp:catalog:' + cat;
  try {
    if (env.WEBHOOKS_KV) {
      const cached = await env.WEBHOOKS_KV.get(cacheKey, 'json');
      if (cached) return J({ items: cached, cached: true }, cors);
    }
    let items = [];
    if (env.DB) {
      const q = cat === 'all'
        ? env.DB.prepare('SELECT * FROM inspiration_items ORDER BY featured DESC, uses DESC')
        : env.DB.prepare('SELECT * FROM inspiration_items WHERE category_id = ? ORDER BY featured DESC, uses DESC').bind(cat);
      items = (await q.all()).results || [];
    }
    if (env.WEBHOOKS_KV && items.length) await env.WEBHOOKS_KV.put(cacheKey, JSON.stringify(items), { expirationTtl: 60 });
    return J({ items }, cors);
  } catch (err) {
    // graceful degradation: let the page fall back to its bundled static catalog
    return J({ items: [], error: err.message, fallback: true }, cors);
  }
}

// POST /api/brief { itemId, nobreak?, palette? }  — build the design-seed brief (no model, no credit)
async function handleBrief(request, env, cors) {
  try {
    const body = await request.json();
    const { itemId, nobreak = false, palette = null } = body;
    let item = null;
    if (env.DB && itemId) item = await env.DB.prepare('SELECT * FROM inspiration_items WHERE id = ?').bind(itemId).first();
    if (!item && !palette) return J({ error: 'unknown itemId' }, cors, 404);

    let pal = palette;
    if (!pal && item && item.palette_id && env.DB)
      pal = await env.DB.prepare('SELECT * FROM palettes WHERE id = ?').bind(item.palette_id).first();

    const mode = nobreak
      ? 'No-Break — single self-contained file, only HTML5/CSS3/vanilla JS, zero dependencies'
      : 'Standard';
    const palLine = pal
      ? `${pal.name || 'Custom'} — base ${pal.base_hex} · primary ${pal.primary_hex} · accent ${pal.accent_hex} · surface ${pal.surface_hex}`
      : 'Designer\'s choice';

    const briefMd =
`# Design Brief — ${item ? item.title : 'Custom palette'}
**Intent:** ${item ? item.description : 'Build using the supplied palette.'}
**Type direction:** ${item ? item.type_direction : 'unset'}
**Color story:** ${palLine}
**Mode:** ${mode}
**Studio prompt:** ${item ? item.seed_prompt : ''}`;

    const briefId = generateId();
    const principal = await principalFromReq(request, env);
    if (principal && env.DB) {
      await env.DB.prepare('INSERT INTO brief_log (id,principal,item_id,brief_md,created_at) VALUES (?,?,?,?,?)')
        .bind(briefId, principal, itemId || null, briefMd, Date.now()).run();
    }
    if (item && env.DB) await env.DB.prepare('UPDATE inspiration_items SET uses = uses + 1 WHERE id = ?').bind(itemId).run().catch(() => {});

    return J({ briefId, briefMd, seed: {
      prompt: item ? item.seed_prompt : '',
      type_direction: item ? item.type_direction : null,
      palette: pal || null, nobreak,
    } }, cors);
  } catch (err) { return J({ error: err.message }, cors, 500); }
}

// POST /api/palette-name { hexes:[...] } — Workers AI evocative names, deterministic fallback
function nameFromHex(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; }
  h = (h * 60 + 360) % 360; const s = mx ? d / mx : 0, v = mx;
  if (v < 0.20) return 'Obsidian'; if (s < 0.12) return 'Quartz Veil';
  if (h < 18 || h >= 345) return 'Garnet'; if (h < 45) return v < 0.72 ? 'Copper' : 'Amber';
  if (h < 80) return 'Pyrite Gold'; if (h < 160) return 'Jade'; if (h < 200) return 'Verdigris';
  if (h < 250) return 'Lapis'; if (h < 300) return 'Amethyst'; return v < 0.62 ? 'Mulberry' : 'Rose Quartz';
}
async function handlePaletteName(request, env, cors) {
  try {
    const { hexes = [] } = await request.json();
    if (!Array.isArray(hexes) || !hexes.length) return J({ error: 'hexes required' }, cors, 400);
    if (env.AI) {
      try {
        const out = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [
          { role: 'system', content: 'You name colors like a premium paint brand (e.g. Farrow & Ball). Reply ONLY with a comma-separated list of evocative 1-2 word names, in order, one per hex. No hashes, no extra text.' },
          { role: 'user', content: 'Name these colors: ' + hexes.join(', ') },
        ] });
        const names = (out.response || '').split(',').map(s => s.trim()).filter(Boolean);
        if (names.length === hexes.length) return J({ names }, cors);
      } catch (_) { /* fall through to deterministic */ }
    }
    return J({ names: hexes.map(nameFromHex), fallback: true }, cors);
  } catch (err) { return J({ error: err.message }, cors, 500); }
}

// POST /api/favorite { itemId }  (auth) — toggle
async function handleFavorite(request, env, cors) {
  const principal = await principalFromReq(request, env);
  if (!principal) return J({ error: 'auth required' }, cors, 401);
  try {
    const { itemId } = await request.json();
    const ex = await env.DB.prepare('SELECT 1 FROM user_favorites WHERE principal=? AND item_id=?').bind(principal, itemId).first();
    if (ex) { await env.DB.prepare('DELETE FROM user_favorites WHERE principal=? AND item_id=?').bind(principal, itemId).run(); return J({ ok: true, favored: false }, cors); }
    await env.DB.prepare('INSERT INTO user_favorites (principal,item_id,created_at) VALUES (?,?,?)').bind(principal, itemId, Date.now()).run();
    return J({ ok: true, favored: true }, cors);
  } catch (err) { return J({ error: err.message }, cors, 500); }
}

// GET /api/favorites  (auth)
async function handleFavorites(request, env, cors) {
  const principal = await principalFromReq(request, env);
  if (!principal) return J({ items: [] }, cors);
  try {
    const r = await env.DB.prepare(
      'SELECT i.* FROM inspiration_items i JOIN user_favorites f ON f.item_id=i.id WHERE f.principal=? ORDER BY f.created_at DESC'
    ).bind(principal).all();
    return J({ items: r.results || [] }, cors);
  } catch (err) { return J({ items: [], error: err.message }, cors, 500); }
}

/* ---- add to the switch (url.pathname) in export default { fetch } ----
      case '/api/inspiration':
        return handleInspiration(request, env, cors);
      case '/api/brief':
        if (request.method === 'POST') return handleBrief(request, env, cors);
        break;
      case '/api/palette-name':
        if (request.method === 'POST') return handlePaletteName(request, env, cors);
        break;
      case '/api/favorite':
        if (request.method === 'POST') return handleFavorite(request, env, cors);
        break;
      case '/api/favorites':
        return handleFavorites(request, env, cors);
   Also add '/inspiration' -> '/inspiration.html' alias near the '/studio' rewrite:
      else if (assetPath === '/inspiration') assetPath = '/inspiration.html';
------------------------------------------------------------------------ */









# DipDesigns — Post-OAuth Inspiration Page · Production Build Handoff

**Target:** `dipdesigns.app` · Cloudflare Worker + Workers AI + D1 + KV + Durable Objects · OpenRouter SkillChain
**Repo:** `github.com/amemecometru/dipdesigns.app` (branch `main`)
**Audience for this doc:** the implementing agent (Opencode) — *apply → verify → push*.
**Hard rule:** stage on a branch and hand the owner a patch. **Never push without explicit owner permission.**

---

## 0. Source of truth (read these before touching anything)

| File | What it is | Touch? |
|---|---|---|
| `worker/wrangler.toml` | bindings: `WEBHOOKS_KV` (KV), `DB` (D1 `dipdesigns-db`), `SESSION_HUB` + `CREDIT_LEDGER` (DOs), `AI` (Workers AI), vars `CREDIT_COST=1` `FREE_DAILY_LIMIT=3` | add D1 + AI block if missing (see §10) |
| `worker/index.js` | all `/api/*` routes, OAuth, Stripe, SSE bus, asset serving | **extend** (new routes) |
| `worker/credit-ledger.js` | `CreditLedger` DO (grant/spend/tier0/free/subscription) | reuse as-is |
| `worker/assets/inspiration.html` | **the current generic one-click placeholder — REPLACE this file** | **rewrite** |
| `worker/assets/index.html` | the Studio shell (served at `/studio`) — has the Handoff.md slide-out + Send-to-Desktop | reuse; add `?brief=` ingestion |
| `worker/assets/client.js` | SkillChain (architect→styler→engineer→debugger), `handleAuthRedirect()`, key mgmt | reuse patterns; add No-Break flag |
| `worker/assets/tokens.css` + `glazier.css` | **Glazier Kit** design system (`.glz-*`, CSS vars) — the ONLY styling source | reuse, do not fork |
| `worker/assets/signin.html` / `signup.html` | OAuth entry; `startOAuth()` currently redirects to `/studio` | **change redirect → `/inspiration.html`** |
| `worker/inline_assets.py` | inlines `assets/*` into `assets-inline.js` (what `index.js` actually serves) | **see §2 asset-hosting note** |

**Critical reality (verified in code):**
- `index.js` serves pages via `serveAsset()` from `./assets-inline.js` (assets are **inlined into the JS bundle**). **Do NOT base64-inline binary images into that bundle** — it blows the Worker size limit. Real images go to **Cloudflare R2 or the `[assets]` static dir** and are referenced by URL. See §2.
- `DB` (D1) and `AI` (Workers AI) are **provisioned but currently unused** in code. This page is where they get switched on.
- OAuth callback redirects to `<redirect>?auth=wek_<key>`; `client.js handleAuthRedirect()` reads `?auth=`, saves to `localStorage['webhooks_email_api_key']`, strips it from the URL. The Inspiration page MUST run the same ingestion (see §3).

---

## 1. Context & North Star

This is the **page a user lands on immediately after OAuth** — the home/inspiration surface, equivalent to v0's home, Bolt's start screen, Lovable's dashboard, or Stitch's canvas entry. Its single job: **spark a build and funnel into the Studio.**

The product's three differentiators must be felt here (not just listed):
1. **Cross-platform send** — vibe/text a design on mobile, send it to a device of your choice in two clicks (the phone→desktop bridge).
2. **`backend-handoff.md`** — when a design is ready, an AI assistant queue slides out and writes a backend handoff tailored to the user's chosen stack.
3. **"No Break" Mode** — every design generated in pure HTML5/CSS3/vanilla JS, zero dependencies that rot.

**Benchmark stance (from the best studios):** v0 leans "start with a template + design systems + build from phone"; Stitch is an AI-native canvas with `DESIGN.md` import/export + MCP; Bolt/Lovable go idea→app fast. **Our wedge they don't have:** the post-design **portable backend blueprint** + the **build-anywhere bridge**. The Inspiration page should read as *spark → build → bridge to production*, not "another template gallery."

**Anti-goal:** do not ship a generic prompt-gallery (that's exactly what the current `inspiration.html` is). Every card is an **opinionated, named direction** with real imagery.

---

## 2. Where it lives + asset hosting

- **Route:** keep `/inspiration.html` (also add a friendly alias `/inspiration` → `inspiration.html` in the `index.js` asset switch, mirroring how `/studio` → `index.html`).
- **Post-OAuth landing:** in `signin.html` and `signup.html`, change `startOAuth()`'s default redirect from `/studio` to `/inspiration.html`. (Studio stays reachable from the nav + every card CTA.)
- **Asset hosting decision (REQUIRED):** create an **R2 bucket** `dipdesigns-assets` (or use the existing `[assets]` static dir if kept out of the inlined bundle) and upload the image set in §12. Reference images by URL (e.g. `https://dipdesigns.app/assets/inspo/teal-supernova.webp`). Convert PNG→WebP/AVIF for weight. **Never** route these through `assets-inline.js`.
  - If using `[assets]`: confirm `wrangler.toml` `[assets] directory = "./assets"` is active in the **deployed** config (the uploaded authoritative toml omits it — re-add it) and that `serveAsset` falls through to the static binding for unknown binary paths.

---

## 3. Auth & session wiring

The page is gated. On load:

```js
// 1. Ingest OAuth handoff (mirror client.js handleAuthRedirect)
const p = new URLSearchParams(location.search);
const authKey = p.get('auth');
if (authKey && authKey.startsWith('wek_')) {
  localStorage.setItem('webhooks_email_api_key', authKey);
  p.delete('auth'); history.replaceState({}, '', location.pathname + (p.toString() ? '?'+p : ''));
}
const KEY = localStorage.getItem('webhooks_email_api_key');
// 2. No key → bounce to signin (preserve intent)
if (!KEY) location.replace('/signin.html?redirect=' + encodeURIComponent('/inspiration.html'));
// 3. Load balance for the credits pill
const bal = await fetch(workerBase()+'/api/balance', { headers: { 'x-api-key': KEY } }).then(r=>r.json());
```

- `workerBase()` = `localStorage['webhooks_email_worker'] || location.origin` (same helper as `client.js`/`studio`).
- Show a **credits pill** in the header (balance + "Buy credits" → existing `/api/checkout`). Subscription state comes from the same `/api/balance` payload (`subscription.status`).
- Reuse canonical localStorage keys (legacy `webhooks_email_*` naming — keep, do not rename, or you break live sessions): `_api_key`, `_worker`, `_proxy`, `_desktop_ip`, `_desktop_key`, `_free_remaining`.

---

## 4. Page IA / layout (Glazier theme, mobile-first)

Order, top to bottom:

1. **Header (sticky):** brand node-dot + "DipDesigns" · nav (Inspiration · Studio · Library · Pricing) · credits pill · avatar/menu. Reuse the header pattern already in `inspiration.html` but add the authed cluster.
2. **Hero:** the **Teal Supernova geode** (asset `f190t82c`) as the backdrop behind an `<h1>` "What will you build?" + one-line subhead + a prompt input that deep-links to `/studio?prompt=…`. Electric-teal CTA `.glz-btn-primary` "Open Studio". Hero must honor `prefers-reduced-motion` (static image; optional subtle parallax otherwise). This image is lit in `--teal #3fe0d0` so it composes onto the Glazier canvas.
3. **Differentiator strip:** three compact cards — *Build from your phone* (cross-platform send), *Backend handoff.md* (the second wedge), *No Break Mode* (toggle). Each links to where it lives (Studio) and has a one-line proof, not marketing fluff.
4. **Inspiration sections** (each a horizontally-scrollable rail on mobile, grid on desktop), in this order: **Business Landing Pages → Résumé → Social Media Studio → Type Directions → Color Stories** (the geode/mineral set) → **Illustrated/Artistic**.
5. **"Sample a palette from any image" promo** → the Geode→Paint-Chip engine (§7), with the two amethyst/cosmos cards as proof.
6. **CTA footer:** "Every idea ships. Open the Studio."

Use only Glazier tokens/classes (`--bg-base #070b12`, `--teal #3fe0d0`, `--amber #f6a93b`, `--font-ui Outfit`, `--font-mono Space Mono`, `.glz-surface-glass`, `.glz-btn`, etc.). Black text on metal surfaces (the readability rule in `glazier.css`).

---

## 5. The Inspiration Card — anatomy + interaction (NEVER one click)

**Current behavior to remove:** in today's `inspiration.html`, a single card click does `window.location.href='/studio?prompt='+…` (lines ~218, 250, 271). The owner explicitly wants **hover + a click, or two clicks — never a single click straight to the Studio.**

**Card states:**
- **Resting:** real thumbnail image, title, category tag, a `stack` chip (`No-Break` / `Tailwind` / `Any`).
- **Hover (desktop) / first tap (mobile):** card lifts (`translateY(-4px)`, teal edge glow `--teal-soft`); an overlay slides up revealing **"what this design is"** (1–2 sentence description), the **style tags** (its Type Direction + Color Story), and two affordances: **"View details"** and **"Create brief → Studio"**.
- **Detail (click #1 → opens a drawer/modal):** full description, the palette chips (with hex), a few "what's inside" bullets (sections it generates), the **No-Break toggle**, the target-stack selector, and the primary CTA **"Create brief & open in Studio."**
- **Create brief (click #2):** generates the design-seed `.md` (§8.1), stores it, navigates to the Studio.

So the minimum path to leave for the Studio is **hover→click-CTA (2 interactions)** or **click-open→click-CTA (2 clicks)**. Wire keyboard + ARIA (cards are buttons; drawer is a focus-trapped dialog).

**Card data model** (one row of `inspiration_items`, see §10):
```json
{
  "id": "biz-saas-northbeam",
  "category_id": "business-landing",
  "title": "SaaS Analytics Landing",
  "blurb": "Indigo hero, product shot, pricing — the modern B2B SaaS pattern.",
  "description": "A conversion-focused SaaS landing: hero with value prop + dual CTA, product dashboard preview, logo strip, feature grid, pricing teaser, FAQ, footer.",
  "type_direction": "swiss-neue",
  "palette_id": "indigo-slate",
  "stack": "any",
  "thumb_asset": "https://dipdesigns.app/assets/inspo/saas-northbeam.webp",
  "seed_prompt": "Build a modern SaaS analytics landing page …(full architect-ready prompt)…",
  "featured": 1
}
```

---

## 6. Categories & REAL content (no placeholders)

### 6.1 Business Landing Pages
Ship **8 named, industry-specific** cards (each with a real concept + `seed_prompt`). Thumbnails: use `el0tttz3` (SaaS) now; generate the remaining 7 to the same bar (see §12 "to-elevate"). Industries:
1. **SaaS / Analytics** ("Northbeam") — indigo, product-led. *(asset `el0tttz3`)*
2. **Restaurant / Café** — warm, menu + reservations, amber palette.
3. **Fitness / Studio** — bold, class schedule, high-energy.
4. **Real Estate / Property** — listings grid, refined navy/gold.
5. **Creative Agency / Portfolio** — editorial, big type, case-study grid.
6. **E-commerce / DTC product** — hero product, social proof, buy CTA.
7. **Local Service (dental/legal/trades)** — trust-first, booking, reviews.
8. **Event / Conference** — schedule, speakers, ticket CTA.

### 6.2 Résumé Builder
3 cards: **Modern Professional** *(asset `b3y9hxwb`)*, **Creative/Designer**, **Minimal/ATS-safe**. Each `seed_prompt` produces a single-page résumé with strong hierarchy; offer No-Break by default (résumés should never depend on a CDN).

### 6.3 Social Media Studio  *(card + sizes now; backend is owner's later build — OUT OF SCOPE here)*
Card asset: `1fr4c2ro`. The deliverable now is the **preset table** (the "correct sizes") + the flow: pick a platform/format → opens Studio on a **fixed-size canvas** with the AI design assistant. Ship this as a `social_presets` constant (also seed into D1 later). **Verified 2026 dimensions:**

| Platform | Format | Size (px) | Ratio | Safe area / note |
|---|---|---|---|---|
| YouTube | Channel banner | 2560×1440 | 16:9 | text/logo safe area **1546×423** centered; min 2048×1152; ≤6 MB |
| YouTube | Profile | 800×800 | 1:1 | renders ~98–176 circle |
| X (Twitter) | Header | 1500×500 | 3:1 | avatar overlays lower-left; keep ~60px top/bottom clear |
| X (Twitter) | Profile | 400×400 | 1:1 | circle crop |
| Facebook | Page cover | 851×315 | ~2.7:1 | mobile renders 640×360; center-safe |
| Facebook | Profile | 320×320 | 1:1 | circle |
| Instagram | Portrait post | 1080×1350 | 4:5 | primary feed format |
| Instagram | Square | 1080×1080 | 1:1 | — |
| Instagram | Story/Reel | 1080×1920 | 9:16 | reserve ~250px top / ~220px bottom for UI |
| LinkedIn | Personal banner | 1584×396 | 4:1 | mobile shows center 1128×396 |
| LinkedIn | Company cover | 1128×191 | ~5.9:1 | keep text centered |
| TikTok | Video / cover | 1080×1920 | 9:16 | — |
| TikTok | Profile | 200×200 | 1:1 | upload higher, downscales |
| Twitch | Channel banner | 1200×480 | 2.5:1 | — |
| Twitch | Offline banner | 1920×1080 | 16:9 | — |
| Pinterest | Standard pin | 1000×1500 | 2:3 | — |

```js
// worker/assets/social-presets.js  (single source; seed into D1 social_presets later)
export const SOCIAL_PRESETS = [
  { platform:'YouTube', format:'Channel Banner', w:2560, h:1440, ratio:'16:9', safe:'1546x423' },
  { platform:'X', format:'Header', w:1500, h:500, ratio:'3:1', note:'avatar lower-left' },
  /* …full table above… */
];
```

### 6.4 Type Directions  *(LOCKED — 4 named, art-directed)*
| Name | Mood / for | Asset | Pairing the brief should set |
|---|---|---|---|
| **Brutalist Editorial** | media/agency, loud | `xv7x12dq` | ultra-condensed grotesque + mono caption |
| **Haute Serif** | luxury/beauty | `h0le8y6x` | high-contrast Didone display + humanist sans body |
| **Retro Groove** | food/music/lifestyle | `fwu96ssf` | rounded retro display + warm sans |
| **Liquid Chrome** | tech/gaming, Y2K | `w1jkm0r9` | inflated grotesque + mono accents |

### 6.5 Color Stories  *(LOCKED — named, with real tokens)*
Editorial set: **Citrus Pop** `p9tzj4km`, **Emerald Atelier** `lmz5odxx`, **Midnight Synth** `plink8dl`, **Terracotta Earth** `820ubhwp`.
Mineral/geode set (palettes extracted via §7): **Amethyst Dusk** (`2e6hb4lj` → Obsidian `#1F1512` · Copper `#AE6146` · Mulberry `#732E5B` · Quartz Veil `#F0E3DF`), **Mineral Cosmos** (`h0ddq9h0` → Obsidian `#12171F` · Lapis `#2E4B73` · Amethyst `#572E73` · Quartz Veil `#DFE6F0`).
Geode hero/section visuals: **Teal Supernova** `f190t82c` (hero), **Amethyst** `q0a3ku67`, **Mineral Cosmos** `5d33onrh`.
Illustrated/Artistic category: **Ghibli** `1emvn6jf`, **Pen & Ink** `xux4yd7n`.

---

## 7. Feature: Geode → Paint-Chip Palette Engine

**What it is:** drop any image (a geode, a sunset, a storefront photo) → get a **named, structured, UI-ready palette** (BASE / PRIMARY / ACCENT / SURFACE) with real hex → tap a chip → a design brief preloaded with those tokens → into the Studio. This is the "spark → usable" mechanic and a genuine differentiator.

**Implementation (cheap, mostly client-side):**
1. **Sample (client-side `<canvas>`):** draw the image, `getImageData`, take the **most-saturated ~15% of pixels**, median-cut/quantize, **bucket across the hue wheel (12 families)**, pick the two most-vivid *different* families as PRIMARY/ACCENT (require ≥45° hue separation), derive BASE = deep tint of primary hue, SURFACE = near-white tint. (Reference algorithm in `palette.py`, delivered with this handoff — port to JS.)
2. **Name (Workers AI, optional, cheap):** `POST /api/palette-name { hexes:[…] }` → the `AI` binding returns evocative designer names (e.g. "Amethyst", "Copper", "Quartz Veil"). **Deterministic fallback** = the hue/lightness name map in `palette.py` (ship it client-side so naming works with zero network/credits).
3. **Use:** "Use this palette" → writes a `palette` object into the design-seed brief (§8.1) and routes to the Studio.

**Credits:** sampling + naming = **free** (no OpenRouter spend; Workers AI naming is negligible and can be 0-credit). Only full Studio generation spends the existing 1 credit.

---

## 8. The two `.md` flows (keep them distinct)

### 8.1 Design-seed brief `.md`  (Inspiration card → Studio) — the FRONT-half
A lightweight markdown brief that **pre-seeds the Studio's architect**. Built by **template merge** from the card row (instant, **no model call, no credit**); optional one-shot Workers AI polish.

```md
# Design Brief — {title}
**Intent:** {description}
**Audience:** {audience}
**Layout / sections:** {sections}
**Type direction:** {type_direction}  (e.g. Haute Serif → Didone display + humanist sans)
**Color story:** {palette.name} — base {base} · primary {primary} · accent {accent} · surface {surface}
**Mode:** {No-Break ON → single-file HTML5/CSS3/vanilla-JS, zero dependencies | Standard}
**Studio prompt:** {seed_prompt}
```

**Handoff to Studio (no giant URLs):** write the brief object to `sessionStorage['dipdesigns_pending_brief']` and navigate `'/studio?brief=local'`. The Studio (`index.html`/`client.js`) reads it on load and seeds the prompt + tokens. Also persist to `brief_log` (D1) when authed, for "Recent briefs." (Keep the legacy `?prompt=` path working as a fallback.)

### 8.2 `backend-handoff.md`  (Studio slide-out) — the BACK-half (Wedge #2)
**Already exists** in the Studio: `POST /api/backend-assistant {prompt, stack}` + the `#handoffPanel` slide-out + `generateHandoff()`. The Inspiration page only **teases/links** it (differentiator strip). Do not rebuild it here. Spec alignment for the second wedge: the artifact is an **agnostic** backend blueprint (data model, endpoints with method/path/payload/response/auth, env var *names* only, and a **wire-up map** binding generated UI elements → endpoints) tailored to the chosen stack — describe *what* the backend must do, never lock to one host.

---

## 9. The three differentiators on the page

1. **Cross-platform send:** strip card → deep-links into the Studio's existing **Send to Desktop** (`receiver.js` on `:3000`, desktop IP/key in Settings). Two clicks: pick design → Send.
2. **`backend-handoff.md`:** strip card → opens Studio with the handoff slide-out (`window.openHandoffPanel`).
3. **No Break Mode:** a **global toggle** (header), persisted to `localStorage['dipdesigns_nobreak']`. When ON, the design-seed brief sets `Mode: No-Break` and the Studio injects this hard constraint into the architect/engineer/free system prompts:
   > "Output a single self-contained file using ONLY HTML5, CSS3, and vanilla JavaScript. No external libraries, frameworks, CDNs, web-font links, build steps, imports, or network calls. Inline all CSS and JS. It must run by opening the file directly."
   Cards carry a `stack` chip so users can see at a glance; No-Break is the default for Résumé.

---

## 10. Backend wiring (the real stack)

### 10.1 `wrangler.toml`
Ensure the authoritative bindings are present (the in-repo copy is missing `[[d1_databases]]` and `[ai]`; the owner's uploaded copy is missing `[assets]` — the **deployed** config needs all of: KV `WEBHOOKS_KV`, D1 `DB`, DOs `SESSION_HUB`+`CREDIT_LEDGER`, `[ai] binding="AI"`, and `[assets] directory="./assets"`). Reconcile into one correct file.

### 10.2 D1 schema (new migration) — note: avoid the reserved word `primary`
```sql
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
  type_direction TEXT, palette_id TEXT, stack TEXT,            -- 'nobreak'|'tailwind'|'any'
  thumb_asset TEXT, seed_prompt TEXT, featured INTEGER DEFAULT 0,
  uses INTEGER DEFAULT 0, created_at INTEGER,
  FOREIGN KEY(category_id) REFERENCES categories(id)
);
CREATE TABLE IF NOT EXISTS user_favorites (
  principal TEXT, item_id TEXT, created_at INTEGER, PRIMARY KEY(principal, item_id)
);
CREATE TABLE IF NOT EXISTS brief_log (
  id TEXT PRIMARY KEY, principal TEXT, item_id TEXT, brief_md TEXT, created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_items_cat ON inspiration_items(category_id);
```
`principal` = the SHA-256 hash already used by the ledger/auth (`principalFromWekKey`). Seed `categories` + `inspiration_items` from the content in §6 (a `seed.sql`).

### 10.3 Workers AI (`AI` binding)
Switch it on for the cheap, latency-sensitive tasks (keep OpenRouter Gemma for full Studio generation):
- **Palette naming** (`/api/palette-name`) — tiny instruct model, e.g. `@cf/meta/llama-3.1-8b-instruct` *(verify against the live Workers AI catalog)*.
- **Optional brief polish** — same model, one shot, behind a flag.
- Deterministic fallbacks must exist for both so the page works if AI is unavailable.

### 10.4 New / changed Worker routes (add to the `switch` in `index.js`)

| Method | Path | Auth | Body | Returns | Purpose | Credits |
|---|---|---|---|---|---|---|
| GET | `/api/inspiration?category=` | none | — | `{items:[…]}` | catalog from D1 (KV-cached); static JSON fallback | free |
| POST | `/api/brief` | `x-api-key` opt | `{itemId, nobreak, palette?}` | `{briefId, briefMd}` | build design-seed brief; log to `brief_log` if authed | free |
| POST | `/api/palette-name` | none | `{hexes:[…]}` | `{names:[…]}` | Workers AI evocative names (det. fallback) | free |
| POST | `/api/favorite` | `x-api-key` | `{itemId}` | `{ok, favored}` | toggle favorite in D1 | free |
| GET | `/api/favorites` | `x-api-key` | — | `{items:[…]}` | user's saved cards | free |
| — | reuse `/api/balance` | `x-api-key` | — | balance+sub | credits pill | — |
| — | reuse `/api/generate` | `wek_` | `{prompt,model}` | `{html,css,js}` | full Studio gen | **1** |
| — | reuse `/api/backend-assistant` | — | `{prompt,stack}` | `{text}` | Wedge #2 (Studio) | per policy |
| — | reuse `/api/auth/*`, `/api/checkout`, `/api/stripe-webhook` | — | — | — | OAuth + Stripe (live price IDs already in `CONFIG.PRICE_IDS`) | — |

### 10.5 KV
- Cache the catalog: `insp:catalog` (+ per-category) with short TTL; bust on seed change.
- (Reuse existing `state:`, `oauth_state:`, `user:email:`, `wek:` namespaces untouched.)

### 10.6 Credit policy (explicit)
Browsing, hovering, opening details, building a brief, sampling/naming a palette = **free**. The only spend is **full Studio generation** (existing 1 credit via `CreditLedger.spend`) and the backend-handoff per existing policy. Anonymous Tier-0 single-shot stays as-is.

### 10.7 UI element → endpoint wire-up map
```
page load                         → handleAuthRedirect(?auth)  +  GET /api/balance
category tabs / rails             → GET /api/inspiration?category=
card hover                        → (no network; reveal overlay)
card click                        → open detail drawer (no network)
detail “Create brief → Studio”    → POST /api/brief → sessionStorage['dipdesigns_pending_brief'] → /studio?brief=local
palette card “Use this palette”   → client canvas sample → POST /api/palette-name → POST /api/brief(palette) → /studio
card “♥ save”                     → POST /api/favorite        ;  Saved tab → GET /api/favorites
hero prompt / “Open Studio”       → /studio?prompt=…
No-Break global toggle            → localStorage['dipdesigns_nobreak']  (injected into brief + Studio prompts)
“Send to device” strip            → /studio  → window Send-to-Desktop (receiver.js :3000)
“backend-handoff.md” strip        → /studio  → window.openHandoffPanel()
credits pill “Buy”                → POST /api/checkout {item} → Stripe
```

---

## 11. Visual / design direction
- **Only** Glazier tokens/classes. Canvas `--bg-base #070b12`; teal `#3fe0d0` for primary/active; amber `#f6a93b` sparingly; `Outfit` UI / `Space Mono` labels. Black text on metal surfaces.
- Hero = Teal Supernova; section headers for Color Stories/Inspiration may use the Amethyst / Mineral-Cosmos blasts as band visuals.
- Motion: card lift + teal edge glow on hover; drawer slides; honor `prefers-reduced-motion`.
- Mobile-first: rails scroll-snap on small screens; grid ≥768px. (Half the app is mobile by design.)
- A11y: cards are buttons; drawer is a focus-trapped `role="dialog"`; AA contrast; visible focus rings (teal).

---

## 12. Asset inventory (delivered with this handoff)

| Role | Name | shortId | viewUrl | Status |
|---|---|---|---|---|
| HERO | Teal Supernova | `f190t82c` | …/701010ec-550e-49e0-a638-a7b3c103a3c0.png | **locked** |
| Section | Amethyst Blast | `q0a3ku67` | …/82c6e152-…png | locked |
| Section | Mineral Cosmos Blast | `5d33onrh` | …/33a61c7c-…png | locked |
| Type | Brutalist Editorial | `xv7x12dq` | …/4c4f61d9-…png | locked |
| Type | Haute Serif | `h0le8y6x` | …/49f42ea2-…png | locked |
| Type | Retro Groove | `fwu96ssf` | …/a4a13208-…png | locked |
| Type | Liquid Chrome | `w1jkm0r9` | …/35a26081-…png | locked |
| Color | Citrus Pop | `p9tzj4km` | …/614a2740-…png | locked |
| Color | Emerald Atelier | `lmz5odxx` | …/b9a714c5-…png | locked |
| Color | Midnight Synth | `plink8dl` | …/dcb40a1d-…png | locked |
| Color | Terracotta Earth | `820ubhwp` | …/01959f1f-…png | locked |
| Palette card | Amethyst Dusk | `2e6hb4lj` | …/7f63397a-…png | locked |
| Palette card | Mineral Cosmos | `h0ddq9h0` | …/8fc893eb-…png | locked |
| Illustrated | Ghibli | `1emvn6jf` | …/924108ea-…png | locked |
| Illustrated | Pen & Ink | `xux4yd7n` | …/cf5f639e-…png | locked |
| Business | SaaS (Northbeam) | `el0tttz3` | …/27959d3e-…png | locked |
| Résumé | Modern Professional | `b3y9hxwb` | …/9484426b-…png | locked |
| Social | Social Media Kit | `1fr4c2ro` | …/8887c754-…png | locked |
| — | (old generic Typography specimen) | `2s0fnayo` | — | **deprecated — do not use** |
| — | (old generic Color swatch) | `b92bug75` | — | **deprecated — do not use** |
| TO ELEVATE | 7 more business landings, 2 more résumés | — | — | generate to the named-direction bar |

(Full URLs share the prefix `https://hyperagent.com/api/files/usergenerated/threads/cmqs0ccv0056e06ad3h0g7kac/images/`. Download → convert to WebP → upload to R2/`[assets]`.)

---

## 13. Acceptance checks
1. After OAuth, the user lands on `/inspiration.html` (not `/studio`); `?auth=` is consumed and stripped; credits pill shows the real `/api/balance`.
2. No card navigates to the Studio on a single click — hover/first-tap reveals; a second intentional action creates the brief and routes.
3. "Create brief → Studio" lands in the Studio with the prompt + type direction + palette tokens pre-applied (via `sessionStorage`), and (if authed) a row in `brief_log`.
4. Palette engine: dropping/selecting an image yields a 4-tone scheme with real hex + names; works with AI off (deterministic fallback); spends 0 credits.
5. No-Break toggle persists and visibly injects the dependency-free constraint into a generated design (verify output has zero external `<link>`/`<script src>`/import).
6. Social presets render the exact sizes in §6.3; selecting one opens the Studio on that fixed canvas. (Backend persistence intentionally absent.)
7. `/api/inspiration` serves from D1, KV-cached; page degrades to static JSON if D1 is unavailable.
8. Page is fully usable on a 390px-wide phone; `prefers-reduced-motion` disables the hero animation. No binary images in `assets-inline.js`.
9. Glazier-only styling; AA contrast; no new fonts beyond Outfit/Space Mono.

---

## 14. Out of scope (now) / later
- **Social-media-builder backend** (saving/exporting banners, brand kits) — owner builds later. Ship card + presets + Studio fixed-canvas entry only.
- Animated video hero (Veo loop of the Teal Supernova) — optional enhancement.
- Community/trending real data — start curated in D1; add telemetry later.

## 15. Build order (apply → verify → push)
1. Reconcile `wrangler.toml` (KV+D1+DOs+AI+assets) on a branch; `wrangler d1 migrations apply dipdesigns-db` for §10.2; seed categories/items.
2. Add new routes to `index.js` (§10.4) with deterministic fallbacks; keep existing routes untouched.
3. Set up R2/`[assets]` image hosting (§2, §12); upload assets as WebP.
4. Rewrite `worker/assets/inspiration.html` (+ a small `inspiration.js`) per §3–§9; reuse Glazier + `client.js` auth pattern.
5. Change OAuth redirect in `signin.html`/`signup.html` → `/inspiration.html`.
6. Add `?brief=` ingestion + No-Break injection to the Studio (`index.html`/`client.js`).
7. Verify against §13 locally (`python3 -m http.server` for visuals; `wrangler dev --remote` for `/api/*`). **Hand the owner a patch — do not push.**
