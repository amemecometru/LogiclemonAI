# Social Media Mini-Studio — Build Spec (v2, for Opus)

> Supersedes `worker/social-studio-spec.md`. Changelog vs v1:
> - **Discord removed** (3 presets) → 16 total. Not our fight — Discord's Nitro tools own that.
> - **Cropping / reposition UX** specced (was missing — the core ask).
> - **Static-vs-animated corrected**: most platforms accept only a static image; motion is opt-in and platform-gated, never auto-injected.
> - Aligned to the **real `inspiration.html` + `inspiration.js`** (Opencode wrote v1 having only seen `inspiration.js`; the HTML already has the header No-Break pill, hero, palette promo, drawer, and `go()`).

## Concept
A constrained Studio mode that opens on a canvas **locked to a platform's exact banner pixels**. The user picks a platform + format; the canvas snaps to those dimensions; they compose a banner (AI-generated and/or their own logo/photo), reposition/crop within the frame against a safe-zone overlay, and export at native size.

## What this is NOT
Not a competitor to Canva's template mountain or Discord's animated-profile tools. The wedge is **precision + portability**: pixel-exact sizes, honest safe zones, on-brand (Glazier or sampled-palette) design, and a clean single-file/native-px export — produced in the same studio you build everything else in.

## Static vs animated (read before building)
| Accepts motion (GIF/MP4/animated) | Static image only |
|---|---|
| X profile (GIF, Premium), TikTok video/cover | YouTube channel art, YouTube/X/FB/IG/LinkedIn/TikTok profiles, FB cover, LinkedIn banners, IG posts, Twitch banners, Pinterest pin |
**Rule:** default export is a **static PNG at native px.** Offer an "Animate" option ONLY for formats flagged `motion:true` in `social-presets.js`. Never inject particle/chrome/neon effects unless the user opts in.

## Flow (inspiration → studio)
1. `inspiration.html`: user opens the **Social Profile Studio** feature card → drawer shows the platform picker (already wired in `inspiration.js`).
2. Pick platform → formats appear → pick a format.
3. `go()` writes `sessionStorage['dipdesigns_pending_brief']` = `{ kind:'social', platform, format, w, h, safe, motion, nobreak }` and navigates `/studio?brief=local`.
4. Studio reads the brief on load, locks the canvas, shows the crop UI.

## Canvas + cropping UX  (the part that was missing)
The Studio preview must become a **fixed-frame editor** when `brief.kind === 'social'`:
1. **Lock the frame** — preview element sized to exactly `w × h`, then visually fit with `transform: scale(min(viewportW/w, viewportH/h))` (display-only; the underlying frame stays native px so export is crisp).
2. **Safe-zone overlay** — a translucent inset rectangle drawn at the `safe` region (e.g. YouTube `1546×423` centered; X header avatar-overlap mask lower-left), with a label. Toggle button in the toolbar. Anything outside the safe zone is dimmed.
3. **Reposition / crop** — when the user adds imagery (uploaded logo/photo OR an AI-generated layer):
   - **drag** to pan within the frame,
   - **scroll / pinch** to zoom-scale,
   - **handles** to resize, **double-click** to reset-fit,
   - **snap guides** at center X/Y and safe-zone edges.
   The frame is a hard clip mask — content outside `w × h` is cropped exactly as the platform will crop it.
4. **Circular-crop preview** — for profile formats (`shape:'circle'`), overlay the circular mask so users see the avatar crop.
5. **Export at native px** — render the frame to a `w × h` canvas (not the scaled viewport) → PNG download. For `motion:true` formats with "Animate" on, export an MP4/GIF; otherwise PNG.

## Platform presets (single source of truth → `worker/assets/social-presets.js`)
Remove the 3 Discord rows from v1. Add `shape` and `motion` fields.

| Platform | Format | w×h | Ratio | shape | motion | Safe zone / note |
|---|---|---|---|---|---|---|
| YouTube | Channel Banner | 2560×1440 | 16:9 | rect | no | safe **1546×423** centered; min 2048×1152; ≤6 MB |
| YouTube | Profile | 800×800 | 1:1 | circle | no | circular crop |
| X | Header | 1500×500 | 3:1 | rect | no | avatar overlaps lower-left; keep ~60px top/bottom clear |
| X | Profile | 400×400 | 1:1 | circle | yes | GIF allowed with Premium |
| Facebook | Page Cover | 851×315 | ~2.7:1 | rect | no | mobile renders 640×360; center-safe |
| Facebook | Profile | 320×320 | 1:1 | circle | no | circular |
| Instagram | Portrait Post | 1080×1350 | 4:5 | rect | no | primary feed format |
| Instagram | Square Post | 1080×1080 | 1:1 | rect | no | — |
| Instagram | Story / Reel | 1080×1920 | 9:16 | rect | no | reserve ~250px top / ~220px bottom for UI |
| LinkedIn | Personal Banner | 1584×396 | 4:1 | rect | no | mobile shows center 1128×396 |
| LinkedIn | Company Cover | 1128×191 | ~5.9:1 | rect | no | keep text centered |
| TikTok | Video / Cover | 1080×1920 | 9:16 | rect | yes | — |
| TikTok | Profile | 200×200 | 1:1 | circle | no | upload larger, downscales |
| Twitch | Channel Banner | 1200×480 | 2.5:1 | rect | no | — |
| Twitch | Offline Banner | 1920×1080 | 16:9 | rect | no | — |
| Pinterest | Standard Pin | 1000×1500 | 2:3 | rect | no | — |

## AI prompt injection (Architect system prompt, when `kind==='social'`)
Append: `Canvas is EXACTLY {w}×{h}px. Keep all text/logos inside the safe zone: {safe}. Output a single self-contained HTML file (inline CSS + vanilla JS), no dependencies. Style in the chosen palette/Glazier. {motion ? 'Subtle motion permitted.' : 'Static composition — no animation.'}`

## Built vs. to-build
**Built (in `inspiration.html` / `inspiration.js` / `social-presets.js`):** feature card, platform/format picker in the drawer, `go()` → studio nav, the presets module + `presetsByPlatform()`. *(Confirm against the actual `inspiration.html` — Opencode hasn't read it yet.)*
**To build (in `client.js` / `index.html`):** the fixed-frame editor (steps 1–5 above), the safe-zone + circular overlays, the prompt injection, native-px export. Update `social-presets.js`: delete Discord, add `shape`/`motion`.

## Credits
Browse presets / pick format = **free**. Generate a banner = **1 credit** (standard). Reposition/crop/export PNG = **free**.

## Out of scope (later — owner builds)
Backend persistence of exports / brand kits; multi-platform "generate all sizes at once"; scheduled posting.
