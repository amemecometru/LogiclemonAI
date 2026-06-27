# DipDesigns — EXACT DIFFS (v2, pinned to your uploaded files)

Pinned to the `index.js` (44KB) and `inspiration.js` (26KB) you uploaded. Apply → verify → patch to owner. **No push without approval.**

> Already done in your repo (verified): `wrangler.toml` has `[ai]`, `[[d1_databases]] DB`, and `[assets] directory="./public"`. **No wrangler edit needed.**
> Prereq: apply migrations `0002_inspiration.sql` + `0003_user_palettes.sql`, and copy `dd-palette.js` to `worker/assets/`.

---

## 1 · `worker/index.js`

### 1a. Insert these handlers — **before** line 972 (`const BLOCKED_UA_PATTERNS = [`)
Uses existing helpers already in this file (`principalFromWekKey`, `generateId`, `env.DB`, `env.AI`).

```js
/* ---- Inspiration hub: brief + palette naming + My Palettes (per-user, D1) ---- */
function _ipJ(o, cors, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', ...cors } }); }
async function _ipPrincipal(request, env){ const k = request.headers.get('x-api-key') || ''; return k.startsWith('wek_') ? (await principalFromWekKey(env, k)) || '' : ''; }

// POST /api/brief — design-seed brief (D1 item if itemId; else posted palette/seed). Free.
async function handleBrief(request, cors, env){
  try{
    const b = await request.json();
    let item = null;
    if (env.DB && b.itemId){ item = await env.DB.prepare('SELECT * FROM inspiration_items WHERE id=?').bind(b.itemId).first().catch(()=>null); }
    let pal = b.palette || null;
    if (!pal && item && item.palette_id && env.DB){ pal = await env.DB.prepare('SELECT * FROM palettes WHERE id=?').bind(item.palette_id).first().catch(()=>null); }
    const mode = b.nobreak ? 'No-Break — single self-contained HTML5/CSS3/vanilla-JS file, zero dependencies' : 'Standard';
    const palLine = pal ? ((pal.name||'Custom')+' — base '+pal.base_hex+' · primary '+pal.primary_hex+' · accent '+pal.accent_hex+' · surface '+pal.surface_hex) : "Designer's choice";
    const seed = (item && item.seed_prompt) || b.seed || '';
    const briefMd = '# Design Brief — '+((item&&item.title)||(pal&&pal.name)||'Custom')+'\n'
      + '**Intent:** '+((item&&item.description)||'Build using the supplied palette.')+'\n'
      + '**Color story:** '+palLine+'\n**Mode:** '+mode+'\n**Studio prompt:** '+seed+'\n';
    const briefId = generateId();
    const principal = await _ipPrincipal(request, env);
    if (principal && env.DB){ await env.DB.prepare('INSERT INTO brief_log (id,principal,item_id,brief_md,created_at) VALUES (?,?,?,?,?)').bind(briefId, principal, b.itemId||null, briefMd, Date.now()).run().catch(()=>{}); }
    return _ipJ({ briefId, briefMd, seed:{ prompt: seed, palette: pal||null, nobreak: !!b.nobreak } }, cors);
  }catch(err){ return _ipJ({ error: err.message }, cors, 500); }
}

// POST /api/palette-name — Workers AI names; deterministic fallback. Free.
function _ipNameHex(h){ var r=parseInt(h.slice(1,3),16)/255,g=parseInt(h.slice(3,5),16)/255,bl=parseInt(h.slice(5,7),16)/255;
  var mx=Math.max(r,g,bl),mn=Math.min(r,g,bl),d=mx-mn,H=0; if(d){ if(mx===r)H=((g-bl)/d)%6; else if(mx===g)H=(bl-r)/d+2; else H=(r-g)/d+4; } H=(H*60+360)%360;
  var s=mx?d/mx:0,v=mx;
  if(v<0.20)return'Obsidian'; if(s<0.12)return'Quartz Veil';
  if(H<18||H>=345)return'Garnet'; if(H<45)return v<0.72?'Copper':'Amber'; if(H<80)return'Pyrite Gold';
  if(H<160)return'Jade'; if(H<200)return'Verdigris'; if(H<250)return'Lapis'; if(H<300)return'Amethyst'; return v<0.62?'Mulberry':'Rose Quartz'; }
async function handlePaletteName(request, cors, env){
  try{
    const { hexes=[] } = await request.json();
    if (!Array.isArray(hexes) || !hexes.length) return _ipJ({ error:'hexes required' }, cors, 400);
    if (env.AI){ try{
      const out = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages:[
        { role:'system', content:'You name colors like a premium paint brand (Farrow & Ball style). Reply ONLY with a comma-separated list of evocative 1-2 word names, in order, one per hex. No hashes, no extra text.' },
        { role:'user', content:'Name these colors: '+hexes.join(', ') } ] });
      const names = (out.response||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
      if (names.length === hexes.length) return _ipJ({ names }, cors);
    }catch(_){} }
    return _ipJ({ names: hexes.map(_ipNameHex), fallback:true }, cors);
  }catch(err){ return _ipJ({ error: err.message }, cors, 500); }
}

// /api/palettes — per-user saved palettes (My Palettes). D1 table user_palettes (migration 0003).
async function handlePalettes(request, cors, env){
  const principal = await _ipPrincipal(request, env);
  if (request.method === 'GET'){
    if (!principal || !env.DB) return _ipJ({ palettes: [] }, cors);
    const r = await env.DB.prepare('SELECT id,name,base_hex,primary_hex,accent_hex,surface_hex,source,created_at FROM user_palettes WHERE principal=? ORDER BY created_at DESC LIMIT 200').bind(principal).all();
    return _ipJ({ palettes: r.results || [] }, cors);
  }
  if (request.method === 'POST'){
    if (!principal) return _ipJ({ error:'auth required' }, cors, 401);
    const b = await request.json();
    if (b.action === 'delete'){
      if (!b.id) return _ipJ({ error:'id required' }, cors, 400);
      await env.DB.prepare('DELETE FROM user_palettes WHERE id=? AND principal=?').bind(b.id, principal).run();
      return _ipJ({ ok:true, deleted:b.id }, cors);
    }
    if (!b.base || !b.primary || !b.accent || !b.surface) return _ipJ({ error:'need base, primary, accent, surface' }, cors, 400);
    const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM user_palettes WHERE principal=?').bind(principal).first();
    if (cnt && cnt.n >= 200) return _ipJ({ error:'palette_limit_reached' }, cors, 409);
    const id = generateId();
    await env.DB.prepare('INSERT INTO user_palettes (id,principal,name,base_hex,primary_hex,accent_hex,surface_hex,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id, principal, (b.name||'Untitled').slice(0,60), b.base, b.primary, b.accent, b.surface, (b.source||'image'), Date.now()).run();
    return _ipJ({ ok:true, id }, cors);
  }
  return _ipJ({ error:'method not allowed' }, cors, 405);
}
```

### 1b. Add switch cases — **after** line 1031 (`case '/api/balance': return handleBalance(request, env, cors);`)
```js
      case '/api/brief':
        if (request.method === 'POST') return handleBrief(request, cors, env);
        break;
      case '/api/palette-name':
        if (request.method === 'POST') return handlePaletteName(request, cors, env);
        break;
      case '/api/palettes':
        return handlePalettes(request, cors, env);
```

### 1c. Add the `/inspiration` alias — lines 1065-1067, extend the asset rewrite
```js
    } else if (assetPath === '/studio') {
      assetPath = '/index.html';
    } else if (assetPath === '/inspiration') {     // ADD
      assetPath = '/inspiration.html';             // ADD
    }
```

---

## 2 · `worker/assets/inspiration.html`
Add **before** the `inspiration.js` script tag (alongside the existing `social-presets.js`):
```html
<script src="dd-palette.js"></script>
```

---

## 3 · `worker/assets/inspiration.js`  (Save into the sampler + My Palettes)

### 3a. Replace `handleImage` (lines 310-314) with:
```js
  var currentSample = null;
  function handleImage(file){var img=new Image();img.onload=function(){var hexes=samplePalette(img);
      nameHexes(hexes).then(function(names){renderChips(hexes,names);
        currentSample={name:(names[1]||'Swatch')+' & '+(names[2]||'Tone'),base:hexes[0],primary:hexes[1],accent:hexes[2],surface:hexes[3],source:'image'};
        ensurePaletteSaveUI();
        var up=$('#usePalette');if(up)up.onclick=function(){go('Design using this sampled palette ('+hexes.join(', ')+').','',hexes);};
      });
    };img.src=URL.createObjectURL(file);}

  function ensurePaletteSaveUI(){
    var pa=$('#palActions'); if(!pa||!window.DDP) return;
    if(!$('#savePalette')){
      var b=document.createElement('button'); b.id='savePalette'; b.className='glz-btn'; b.style.cssText='width:100%;margin-top:8px';
      b.innerHTML='&#65291; Save to My Palettes'; pa.appendChild(b);
      b.addEventListener('click',function(){ if(!currentSample)return; DDP.Palettes.save(currentSample).then(renderMyPalettes); });
    }
    if(!$('#myPalettes')){
      var w=document.createElement('div'); w.id='myPalettes'; w.style.cssText='margin-top:14px;display:flex;flex-direction:column;gap:8px';
      pa.parentNode.insertBefore(w, pa.nextSibling);
    }
  }
  function renderMyPalettes(){
    var w=$('#myPalettes'); if(!w||!window.DDP) return;
    DDP.Palettes.list().then(function(arr){
      if(!arr.length){ w.innerHTML=''; return; }
      w.innerHTML='<div class="glz-label-mono" style="margin-bottom:4px">MY PALETTES</div>'+arr.map(function(p){
        return '<div class="mp-item" draggable="true" style="display:flex;align-items:center;gap:8px;border:1px solid var(--line-dark);border-radius:10px;padding:6px 9px;cursor:grab">'+
          '<span style="display:flex;gap:3px">'+[p.base,p.primary,p.accent,p.surface].map(function(c){return '<i style="width:15px;height:15px;border-radius:4px;background:'+c+';border:1px solid rgba(255,255,255,.15)"></i>';}).join('')+'</span>'+
          '<span style="flex:1;font-size:12px;color:var(--ink-on-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p.name||'Untitled')+'</span>'+
          '<button class="mp-del" title="Delete" style="border:none;background:none;color:var(--ink-on-dark-dim);cursor:pointer;font-size:13px">&#10005;</button></div>';
      }).join('');
      w.querySelectorAll('.mp-item').forEach(function(el,i){var p=arr[i];if(!p)return;
        var pal={name:p.name,base:p.base,primary:p.primary,accent:p.accent,surface:p.surface};
        el.addEventListener('dragstart',function(e){window.__ddPalette=pal;e.dataTransfer.setData('text/plain','palette');});
        el.addEventListener('click',function(e){if(e.target.closest('.mp-del'))return;window.__ddPalette=pal;});
        el.querySelector('.mp-del').addEventListener('click',function(e){e.stopPropagation();DDP.Palettes.remove(p.id).then(renderMyPalettes);});
      });
    });
  }
```

### 3b. In `init()` (around line 330), add after `initPaletteEngine();`
```js
    renderMyPalettes();
```

---

## 4 · OPTIONAL — Apply a saved palette to a LIVE template preview (gallery drawer)
Today `GALLERY` cards show placeholder SVGs (`/inspo/*-placeholder.svg`) and only 4 categories have real template files (`tpl-saas-landing`, `tpl-portfolio`, `tpl-link-in-bio`, `mini-autobiography`). To let users *see* a saved palette applied to a real page:
1. Add a `preview` field to the gallery items that have a template file, e.g. `preview:'/templates/tpl-saas-landing.html'`.
2. In `openGalleryDrawer`, when `g.preview` exists, render `'<iframe id="gPrev" src="'+g.preview+'" style="width:100%;height:300px;border:1px solid var(--line-dark);border-radius:10px"></iframe>'` and a row of My-Palette chips; on chip click: `DDP.applyToIframe(document.getElementById('gPrev'), pal, nbOn()?'dark':'light')`.
3. The other categories (restaurant, fitness, ecommerce, event) need their template files built before they can show live previews — flag for a later pass.

---

## 5 · Still required for end-to-end
- **Studio `?brief=` ingestion (#9):** `index.html`/`client.js` must read `sessionStorage['dipdesigns_pending_brief']` on load, seed the prompt, apply the palette tokens, and honor the No-Break flag. Until then, card/palette → Studio falls back to `/studio?prompt=` (works, but the rich brief/palette doesn't carry).
- **Images:** real `/inspo/*` assets in `worker/public/inspo/` (the gallery currently points at `*-placeholder.svg`).

## 6 · Verify
- `POST /api/palette-name` returns names (AI or fallback); sampler chips get real names.
- Sample image → **Save** → row appears under **My Palettes**; reload (signed-in) → persists (`GET /api/palettes`); **✕** deletes.
- `POST /api/brief` returns `{briefId, briefMd, seed}`; gallery "Create brief" no longer 404-falls-back.
- `/inspiration` serves `inspiration.html`.
