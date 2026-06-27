# READ ME FIRST — DipDesigns drop-in (canonical files only)

Everything in this zip is a **keeper**, already in the correct folder layout. Junk/stale versions are NOT here. Three buckets:

## ✅ ADD — new files, safe to drop straight in (they don't exist yet)
```
worker/assets/dd-palette.js
worker/assets/templates/tpl-saas-landing.html
worker/assets/templates/tpl-link-in-bio.html
worker/assets/templates/tpl-portfolio.html
worker/assets/templates/mini-autobiography.html
worker/migrations/0002_inspiration.sql
worker/migrations/0003_user_palettes.sql
```

## ✋ EDIT IN PLACE — do NOT overwrite these; insert the diffs from `docs/snippet-handoff-exact.md`
```
worker/index.js              (§1: 3 handlers + switch cases + /inspiration alias)
worker/assets/inspiration.js (§3: replace handleImage + add My-Palettes)
worker/assets/inspiration.html (§2: one <script src="dd-palette.js"> line)
```
These three are your live source of truth (Opencode's current versions). Replacing them = losing Opencode's work.

## ⚠️ OPTIONAL
```
worker/assets/social-presets.js   — you already have one; use this only to drop Discord (16 presets vs 19).
```

## 📄 docs/ — read, do not deploy
- `snippet-handoff-exact.md` ← THE build instructions (pinned to your real files, line-anchored)
- `INSPIRATION_PAGE_HANDOFF.md` ← design rationale / full spec (reference)
- `social-studio-spec.v2.md` ← social mini-studio, future build (reference)
- `_demos/palette-apply-demo.html`, `_demos/gallery-views.html` ← reference demos, NOT deployed

## 🖼️ images — NOT in this zip
The `/inspo/*` images (hero, type, color, geode, palette cards) are binary and bundled separately. Until they're in `worker/public/inspo/`, the gallery shows placeholder SVGs.

## ❌ IGNORE these names if you see them in the chat/Library (older, duplicate, or folded-in)
- `inspiration.html`, `inspiration.js`  → my EARLY full copies. **Stale** — your repo's are newer. Do not use to overwrite.
- `snippet-handoff.md`  → superseded by `snippet-handoff-exact.md`.
- `inspiration-routes.snippet.js`, `palette-routes.snippet.js`  → folded into `snippet-handoff-exact.md` §1.
- `templates-catalog.js`  → redundant with your inline `GALLERY`.
- `palette.py`, `build_preview.py`  → local build scripts, not part of the app.

## Apply order
1. Copy the ✅ ADD files to their paths (this zip's layout matches the repo).
2. Apply migrations: `npx wrangler d1 migrations apply dipdesigns-db --remote`
3. Do the ✋ EDIT-IN-PLACE inserts from `docs/snippet-handoff-exact.md`.
4. (Optional) replace `social-presets.js`. (Later) add `/inspo` images; write Studio `?brief=` ingestion (#9).
5. Verify (see snippet-handoff-exact.md §6) → hand owner the patch. No push without approval.
