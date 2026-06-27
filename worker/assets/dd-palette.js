/* ============================================================================
 * DipDesigns · dd-palette.js — shared client module (NO-BREAK, zero deps)
 * Load once in inspiration.html (and the Studio) BEFORE inspiration.js:
 *     <script src="dd-palette.js"></script>
 * Provides window.DDP:
 *   DDP.deriveTheme(palette, mode)  -> { --c-bg, --c-surface, ... } token map
 *   DDP.applyToIframe(iframe, palette, mode)  -> themes a live template preview
 *   DDP.Palettes.{ list, save, remove }       -> My Palettes (D1 when signed in, localStorage fallback)
 * palette = { name, base, primary, accent, surface }   mode = 'light' | 'dark'
 * Pairs with /api/palettes (palette-routes.snippet.js) + 0003_user_palettes.sql,
 * and the html[data-dd-applied]{…} adapter appended to each template.
 * ==========================================================================*/
(function (w) {
  'use strict';
  function hx(h){h=(h||'#000000').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function toHex(c){return '#'+c.map(function(v){return ('0'+Math.round(Math.max(0,Math.min(255,v))).toString(16)).slice(-2);}).join('');}
  function lin(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}
  function L(c){return 0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);}
  function ratio(a,b){var la=L(a)+0.05,lb=L(b)+0.05;return la>lb?la/lb:lb/la;}
  function mix(a,b,t){return a.map(function(v,i){return v+(b[i]-v)*t;});}
  function bestText(bg){var d=[14,17,22],l=[246,248,251];return ratio(bg,d)>=ratio(bg,l)?d:l;}
  function onAccent(c){return L(c)>0.45?'#11151b':'#ffffff';}

  // Contrast-aware role mapping: 4 swatches + mode -> 8 canonical tokens
  function deriveTheme(p, mode){
    var base=hx(p.base),prim=hx(p.primary),acc=hx(p.accent),surf=hx(p.surface);
    var ends=[base,prim,acc,surf].slice().sort(function(a,b){return L(a)-L(b);});
    var bg = mode==='dark' ? ends[0] : ends[3];
    var surface = mode==='dark' ? mix(bg,[255,255,255],0.08) : mix(bg,[255,255,255],0.45);
    var text = bestText(bg);
    return {
      '--c-bg':toHex(bg),
      '--c-surface':toHex(surface),
      '--c-text':toHex(text),
      '--c-text-dim':toHex(mix(text,bg,0.42)),
      '--c-accent':toHex(prim),
      '--c-accent-2':toHex(acc),
      '--c-line':toHex(mix(text,bg,0.82)),
      '--c-on-accent':onAccent(prim)
    };
  }

  // Theme a live template <iframe> (same-origin: direct inject; else postMessage)
  function applyToIframe(iframe, palette, mode){
    var t = deriveTheme(palette, mode||'light');
    try{
      var d = iframe.contentDocument; if(!d) throw 0;
      d.documentElement.setAttribute('data-dd-applied','');
      var s = d.getElementById('dd-theme');
      if(!s){ s = d.createElement('style'); s.id='dd-theme'; d.head.appendChild(s); }
      s.textContent = ':root{'+Object.keys(t).map(function(k){return k+':'+t[k];}).join(';')+'}';
      return true;
    }catch(e){
      try{ iframe.contentWindow.postMessage({type:'dd-theme', tokens:t},'*'); }catch(_){}
      return false;
    }
  }
  function clearIframe(iframe){
    try{ var d=iframe.contentDocument; d.documentElement.removeAttribute('data-dd-applied');
      var s=d.getElementById('dd-theme'); if(s) s.remove(); }catch(e){}
  }

  // ---- My Palettes (per-user via D1; localStorage fallback for anon/Tier-0) ----
  function getKey(){try{return localStorage.getItem('webhooks_email_api_key')||'';}catch(e){return '';}}
  function wbase(){try{return (localStorage.getItem('webhooks_email_worker')||location.origin).replace(/\/+$/,'');}catch(e){return '';}}
  function norm(r){return {id:r.id,name:r.name,base:r.base_hex,primary:r.primary_hex,accent:r.accent_hex,surface:r.surface_hex,source:r.source};}
  var LK='dipdesigns_palettes';
  function loc(){try{return JSON.parse(localStorage.getItem(LK)||'[]');}catch(e){return [];}}
  function setLoc(a){try{localStorage.setItem(LK,JSON.stringify(a));}catch(e){}}
  var Palettes = {
    list:function(){var key=getKey();
      if(key) return fetch(wbase()+'/api/palettes',{headers:{'x-api-key':key}}).then(function(r){return r.json();}).then(function(j){return (j.palettes||[]).map(norm);}).catch(function(){return loc();});
      return Promise.resolve(loc());},
    save:function(p){var key=getKey();var body={name:p.name||'Untitled',base:p.base,primary:p.primary,accent:p.accent,surface:p.surface,source:p.source||'image'};
      if(key) return fetch(wbase()+'/api/palettes',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){return j.id;}).catch(function(){return saveLoc(body);});
      return Promise.resolve(saveLoc(body));},
    remove:function(id){var key=getKey();setLoc(loc().filter(function(x){return x.id!==id;}));
      if(key && String(id).indexOf('loc_')!==0) return fetch(wbase()+'/api/palettes',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({action:'delete',id:id})}).catch(function(){});
      return Promise.resolve();}
  };
  function saveLoc(p){p.id='loc_'+Date.now();var a=loc();a.unshift(p);setLoc(a);return p.id;}

  w.DDP = { deriveTheme:deriveTheme, applyToIframe:applyToIframe, clearIframe:clearIframe, Palettes:Palettes };
})(window);
