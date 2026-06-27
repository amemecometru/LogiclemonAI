# Social Media Mini-Studio — Build Spec

## Concept

A constrained Studio mode that opens at a fixed canvas size matching the chosen platform's exact banner dimensions. User picks a platform + format (e.g. YouTube Channel Banner, Instagram Story), the Studio canvas locks to those pixels, and the AI designer generates an animated HTML/JS banner with effects that static images can't touch.

## Differentiation

Static banners are commodities. Animated HTML banners that float particles, shift iridescent chrome, and pulse neon grids — and export at the correct platform size with safe zones respected — is the wedge.

## How it works

### Flow (from inspiration page)

1. User clicks "Social Profile Studio" card in the FEATURES grid
2. Drawer opens showing the platform picker (already implemented in `inspiration.js`)
3. User selects a platform → format sizes appear
4. User clicks a format → `go()` writes to `sessionStorage` and navigates to `/studio?brief=local` with a prompt describing the fixed canvas

### Canvas constraint

The Studio (`index.html` / `client.js`) must read the target dimensions from `sessionStorage['dipdesigns_pending_brief']` and lock the preview area to exactly `w × h` pixels. The AI prompt must include:
- "Output a single self-contained HTML file with inline CSS and JS"
- "Canvas is exactly `w`×`h` pixels"
- "Respect the safe zone: `safe area description`"
- "Include animated effects: floating particles, gradient animation, or neon glow"
- "Style in the Glazier design system (dark background, teal `#3fe0d0` accents)"

## Platform presets (single source of truth)

Source: `worker/assets/social-presets.js`

| Platform | Format | Size (px) | Ratio | Safe zone / note |
|---|---|---|---|---|
| YouTube | Channel Banner | 2560×1440 | 16:9 | text/logo safe **1546×423** centered; min 2048×1152; ≤6 MB |
| YouTube | Profile | 800×800 | 1:1 | circular crop |
| X | Header | 1500×500 | 3:1 | avatar overlaps lower-left; keep ~60px top/bottom clear |
| X | Profile | 400×400 | 1:1 | circular crop; animated GIF with Premium |
| Facebook | Page Cover | 851×315 | ~2.7:1 | mobile renders 640×360; center-safe |
| Facebook | Profile | 320×320 | 1:1 | circular |
| Instagram | Portrait Post | 1080×1350 | 4:5 | primary feed format |
| Instagram | Square Post | 1080×1080 | 1:1 | — |
| Instagram | Story / Reel | 1080×1920 | 9:16 | reserve ~250px top / ~220px bottom for UI |
| LinkedIn | Personal Banner | 1584×396 | 4:1 | mobile shows center 1128×396 |
| LinkedIn | Company Cover | 1128×191 | ~5.9:1 | keep text centered |
| TikTok | Video / Cover | 1080×1920 | 9:16 | — |
| TikTok | Profile | 200×200 | 1:1 | upload larger, downscales |
| Twitch | Channel Banner | 1200×480 | 2.5:1 | — |
| Twitch | Offline Banner | 1920×1080 | 16:9 | — |
| Discord | Server Banner | 960×540 | 16:9 | animated GIF with Nitro |
| Discord | Server Avatar | 512×512 | 1:1 | animated GIF with Nitro |
| Discord | Profile Banner | 600×240 | 5:2 | Nitro only |
| Pinterest | Standard Pin | 1000×1500 | 2:3 | — |

## Effects to support (prompt-level, injected into the system prompt)

1. **Floating particles** — small circles/glints drifting upward, gold or teal
2. **Iridescent chrome** — gradient that shifts hue on a metallic surface (silver → teal → purple)
3. **Neon grid** — perspective grid lines that pulse with a glow
4. **Gradient animation** — background smoothly transitions between two deep colors
5. **Typing text** — headline characters appear one by one with cursor blink

## What's already built

- `inspiration.js`: social-studio feature card with `action: 'picker'` — opens platform/format picker in the drawer, clicking a format calls `go()` with a dimension-aware prompt
- `social-presets.js`: all platform data as a JS constant, with `presetsByPlatform()` grouping helper
- `inspiration.html`: the drawer overlay, platform grid, format buttons, and `go()` → Studio navigation

## What needs building (in client.js / index.html)

1. **Read `sessionStorage` brief on Studio load** — extract `w`, `h`, `safe` from the pending brief if present
2. **Lock the preview canvas** — the `#preview` iframe element gets `style="width:{w}px;height:{h}px"` with `transform: scale(...)` to fit the viewport
3. **Show safe-zone overlay** — a translucent rectangle overlay marking the text/logo safe area, togglable via a button
4. **Inject platform constraint into the Architect prompt** — append "Canvas: {w}×{h}px. Safe zone: {safe}. Output single self-contained file."
5. **Export at native size** — the existing export PNG logic must output at `w`×`h`, not the scaled viewport size

## Credits

- Browsing presets, picking a format = **free** (0 credits)
- Generating a banner in the Studio = **1 credit** (standard generation cost)
- Export as PNG = **free**

## Out of scope (later)

- Backend persistence of banner exports / brand kits — user builds later
- Multi-page social kit generation (all platforms at once) — start with one canvas at a time
