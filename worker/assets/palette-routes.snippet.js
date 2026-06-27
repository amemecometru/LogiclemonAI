/* ============================================================================
 * DipDesigns · "My Palettes" routes — PASTE INTO worker/index.js
 * Per-user saved palettes for the Apply-to-design feature + design history.
 * Deps already in index.js: principalFromWekKey(env,key), generateId().
 * D1: env.DB  (apply 0003_user_palettes.sql first). Per-user, abuse-capped.
 *   GET  /api/palettes            -> { palettes:[...] }  (signed-in; else [])
 *   POST /api/palettes            -> save {name,base,primary,accent,surface,source} -> { id }
 *   POST /api/palettes {action:'delete', id} -> { deleted }
 * ==========================================================================*/
function _Jp(o, cors, s){ return new Response(JSON.stringify(o), { status: s||200, headers: { 'Content-Type':'application/json', ...cors } }); }
async function _principalP(request, env){ const k = request.headers.get('x-api-key') || ''; return k.startsWith('wek_') ? (await principalFromWekKey(env, k)) || '' : ''; }

async function handlePalettes(request, env, cors){
  const principal = await _principalP(request, env);

  if (request.method === 'GET'){
    if (!principal || !env.DB) return _Jp({ palettes: [] }, cors);   // anon -> client uses localStorage
    const r = await env.DB.prepare(
      'SELECT id,name,base_hex,primary_hex,accent_hex,surface_hex,source,created_at FROM user_palettes WHERE principal=? ORDER BY created_at DESC LIMIT 200'
    ).bind(principal).all();
    return _Jp({ palettes: r.results || [] }, cors);
  }

  if (request.method === 'POST'){
    if (!principal) return _Jp({ error: 'auth required' }, cors, 401);
    const b = await request.json();

    if (b.action === 'delete'){
      if (!b.id) return _Jp({ error: 'id required' }, cors, 400);
      await env.DB.prepare('DELETE FROM user_palettes WHERE id=? AND principal=?').bind(b.id, principal).run(); // scoped: can't delete others'
      return _Jp({ ok: true, deleted: b.id }, cors);
    }

    if (!b.base || !b.primary || !b.accent || !b.surface)
      return _Jp({ error: 'need base, primary, accent, surface' }, cors, 400);

    const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM user_palettes WHERE principal=?').bind(principal).first();
    if (cnt && cnt.n >= 200) return _Jp({ error: 'palette_limit_reached' }, cors, 409); // abuse cap

    const id = generateId();
    await env.DB.prepare(
      'INSERT INTO user_palettes (id,principal,name,base_hex,primary_hex,accent_hex,surface_hex,source,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).bind(id, principal, (b.name || 'Untitled').slice(0,60), b.base, b.primary, b.accent, b.surface, (b.source || 'image'), Date.now()).run();
    return _Jp({ ok: true, id }, cors);
  }
  return _Jp({ error: 'method not allowed' }, cors, 405);
}
/* add to the fetch() switch:  case '/api/palettes': return handlePalettes(request, env, cors); */
