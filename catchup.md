# Catch-Up Handoff — bring the repo (57c7b9b) to current studio state

> **For:** Opencode · **Flow:** apply → verify → push. **Do NOT touch `worker/assets/client.js`.**
> 57c7b9b is a good foundation but a few turns stale. This syncs the studio + funnel + one kit fix and finishes cleanup.

## What's stale in 57c7b9b (verified against the pushed files)
- `worker/assets/index.html` is the early **combined "Export & Share"** studio — missing the Export/Share **split**, the **menu-z-index fix** (menus render behind the preview), the **device click-to-open** fix, and the entire **Handoff.md backend slide-out (Wedge #2) + "Target stack" pill**.
- `worker/assets/signin.html` OAuth redirect returns to **itself** → sign-in completes but lands nowhere (nothing consumes `?auth`).
- `worker/assets/tokens.css` lacks the silver dim-text contrast fix.
- A **stale root `client.js`** (pre-slice legacy dupe) is still tracked.

## Apply (overwrite with the attached files)
1. **`worker/assets/index.html`** ← attached. Current studio: separate **Export ▾** + **Share ▾** pills (header `z-index` raised so their menus sit *above* the preview), device + zoom + Export open on **click**, and a silver **Handoff.md** button bottom-LEFT of the preview → slides a panel into the lower-center with a **"Target stack ▾"** provider pop-out → Generate writes a `backend-handoff.md`.
2. **`worker/assets/signin.html`** ← attached. OAuth `redirect` now points at the studio root `/`, so the returned `?auth=wek_` is consumed by `client.js` and the user lands signed-in.
3. **`worker/assets/tokens.css`** ← attached. `--ink-on-metal-dim:#262d37` (readable dim text on silver).
4. **Remove the stale root dupe:** `git rm client.js` *(repo root — NOT `worker/assets/client.js`)*. Nothing serves it.

## DO NOT TOUCH
- **`worker/assets/client.js`** — the ENGINE, and it's correct as-is. Its `webhooks.email` strings are **functional** (localStorage keys + the live Worker URL `webhooks-email.logiclemonai.workers.dev`), not just branding. The rename is a separate coordinated pass (worker name + URL + OAuth callbacks + localStorage keys) — never a blind find-replace.
- **`worker/assets/landing.html`** — the repo's phone-bridge hero is the right one. Leave it. (No "split-metal hero".)
- **`worker/assets/glazier.css`** — already v3, unchanged.

## Verify
- `node --check worker/assets/client.js` → still passes (untouched).
- Studio `/`: **Export ▾** and **Share ▾** are two separate pills; their menus open **on top of** the preview. Device/zoom/Export open on click. Silver **Handoff.md** bottom-left → slide-out with the **Target stack** pop-out (Agnostic / Cloudflare / Node-Express / Supabase / FastAPI / Next.js / Firebase / Django / Rails) → Generate → Download/Copy `backend-handoff.md`.
- `/signin.html`: GitHub/Google redirect to the Worker and return to `/`. (Full round-trip needs the deploy + OAuth secrets.)
- `git status` clean; root `client.js` gone.

## Commit
```
Sync studio to current: Export/Share split + menu fix + backend-handoff slide-out;
signin→studio redirect; tokens dim-contrast; drop stale root client.js
```
