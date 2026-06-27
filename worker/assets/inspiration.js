(function () {
  'use strict';
  var KEY_API = 'webhooks_email_api_key';
  var KEY_WORKER = 'webhooks_email_worker';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return (r || document).querySelectorAll(s); };
  var workerBase = function () { return (localStorage.getItem(KEY_WORKER) || location.origin).replace(/\/+$/, ''); };
  var getKey = function () { return localStorage.getItem(KEY_API) || ''; };
  var enc = encodeURIComponent;

  var PALETTES = {
    'amethyst-dusk':   { name: 'Amethyst Dusk',   hex: ['#1F1512', '#AE6146', '#732E5B', '#F0E3DF'] },
    'mineral-cosmos':  { name: 'Mineral Cosmos',  hex: ['#12171F', '#2E4B73', '#572E73', '#DFE6F0'] },
    'citrus-pop':      { name: 'Citrus Pop',      hex: ['#1A1411', '#FF6B3D', '#FFC247', '#FFF3E6'] },
    'emerald-atelier': { name: 'Emerald Atelier', hex: ['#0E1A14', '#1F7A5A', '#C8A24A', '#F2EDE2'] },
    'midnight-synth':  { name: 'Midnight Synth',  hex: ['#0B0B14', '#6E57FF', '#2BE0E0', '#E9E9F5'] },
    'terracotta-earth':{ name: 'Terracotta Earth',hex: ['#2A1A12', '#C0673B', '#7E8B57', '#F2E7DA'] }
  };
  var ROLES = ['BASE', 'PRIMARY', 'ACCENT', 'SURFACE'];

  var FEATURES = [
    { id: 'palette-engine', title: 'Palette Engine', tag: 'STUDIO', tagType: 'studio',
      desc: 'Drop any image. Get a named, structured palette with real hex values. Build with it in one click.',
      detail: 'Upload any photograph — a geode, a sunset, a storefront. The engine samples the most saturated pixels, extracts a 4-tone palette (BASE / PRIMARY / ACCENT / SURFACE), and names each color like a premium paint brand. Works entirely on-device; Workers AI naming is optional. Zero credits.',
      action: 'scroll', target: 'paletteSection' },
    { id: 'social-studio', title: 'Social Profile Studio', tag: 'STUDIO', tagType: 'studio',
      desc: 'Banners at exact platform dimensions with effects static tools cannot touch.',
      detail: 'Pick a platform and format. The Studio opens at the precise pixel dimensions with safe zones marked. Design with floating particles, iridescent gradients, neon grids — then export as a ready-to-upload PNG at the correct size.',
      action: 'picker' },
    { id: 'website-builder', title: 'Website Builder', tag: 'STUDIO', tagType: 'studio',
      desc: 'Full business websites from a single prompt.',
      detail: 'Describe your business. The Studio generates a complete multi-page website with hero, features, pricing, FAQ, contact, and footer. Every section is real, generated code. No templates. No placeholders.',
      action: 'navigate', href: '/studio' }
  ];

  var GALLERY = [
    { id: 'g-saas', title: 'SaaS Analytics Landing', category: 'Business Landing', type: 'wide',
      blurb: 'Indigo hero, product shot, pricing — the modern B2B SaaS pattern.',
      desc: 'A conversion-focused SaaS landing: hero with value prop + dual CTA, product dashboard preview, logo strip, 3-up feature grid, pricing teaser, FAQ, footer. Clean Inter-style type, generous whitespace, indigo primary.',
      palette: 'mineral-cosmos', img: '/inspo/saas-northbeam.webp',
      sections: 'Hero · Feature grid · Pricing teaser · FAQ · Footer',
      seed: 'Build a modern B2B SaaS analytics landing page. Hero: bold headline, one-line subhead, primary CTA "Start free" + ghost "Book a demo", product dashboard preview with charts on the right. Below: logo strip, 3-column feature grid with icons, 3-tier pricing with monthly/annual toggle, FAQ accordion, footer. Clean Inter-style type, generous whitespace, soft shadows, indigo primary. Real copy, responsive, no lorem ipsum.' },
    { id: 'g-restaurant', title: 'Restaurant & Café', category: 'Business Landing', type: 'square',
      blurb: 'Warm amber-toned site with menu, reservations, and location.',
      desc: 'A warm, inviting restaurant site: hero with food photography + reservation CTA, full menu with pricing cards, about section with story, reviews carousel, contact with map and hours. Amber palette, friendly serif headings.',
      palette: 'terracotta-earth', img: '/inspo/color-terracotta-earth.webp',
      sections: 'Hero · Menu · About · Reviews · Contact',
      seed: 'Build a warm restaurant landing page. Hero: full-bleed food photo, headline, subhead, "Reserve a table" CTA. Below: full menu with pricing cards and dietary tags, About section with story and team photo, reviews carousel with star ratings, contact section with map, hours, and address. Amber/warm palette, friendly serif headings. Real copy, responsive.' },
    { id: 'g-fitness', title: 'Fitness Studio', category: 'Business Landing', type: 'wide',
      blurb: 'High-energy hero, class schedule, trainer grid.',
      desc: 'A bold fitness studio page: full-bleed hero with action shot + "Start free trial" CTA, class schedule grid with filter tabs, trainer cards with credentials, pricing tiers, and a "join today" sticky banner. Emerald accent, large display type.',
      palette: 'emerald-atelier', img: '/inspo/color-emerald-atelier.webp',
      sections: 'Hero · Schedule · Trainers · Pricing · CTA',
      seed: 'Build a high-energy fitness studio landing page. Hero: full-bleed action shot, bold headline, "Start free trial" CTA. Class schedule grid with day/time filters and filter tabs for class type. Trainer cards with photos, credentials, and specialties. Three pricing tiers with feature lists. Sticky "Join today" banner on scroll. Emerald green accent, large display type, bold typography. Responsive.' },
    { id: 'g-portfolio', title: 'Creative Portfolio', category: 'Business Landing', type: 'square',
      blurb: 'Editorial layout, big type, case-study grid.',
      desc: 'An editorial agency portfolio: full-width hero with headline + reel preview, project grid with filter, client logo strip, services explainer, team cards, and contact form. Amethyst accents, generous whitespace, bold typography.',
      palette: 'amethyst-dusk', img: '/inspo/illus-pen-ink.webp',
      sections: 'Hero · Projects · Services · Team · Contact',
      seed: 'Build a creative agency portfolio page. Hero: full-width headline with type treatment, reel/video preview. Project grid with category filter and hover-reveal. Client logo strip. Services explainer with icons. Team cards with headshots and roles. Contact form. Amethyst accents, generous whitespace, bold editorial typography. Clean, minimal, responsive.' },
    { id: 'g-resume', title: 'Modern Résumé', category: 'Resume', type: 'square',
      blurb: 'Two-column, strong hierarchy, one accent color — ATS-friendly.',
      desc: 'Single-page résumé: header with name + title, left column for contact/skills/education, right column for experience with concise bullets. One accent color for section heads. Print-friendly, single-file HTML, zero dependencies.',
      palette: 'mineral-cosmos', img: '/inspo/resume-modern.webp',
      sections: 'Header · Skills · Experience · Education',
      seed: 'Build a clean single-page professional résumé. Header with name and title. Narrow left column for contact, skills, education. Wider right column for work experience with concise bullet points. One tasteful accent color for section headings. Strong typographic hierarchy. Print-friendly. Single self-contained file, no dependencies.' },
    { id: 'g-social', title: 'Social Media Kit', category: 'Social', type: 'wide',
      blurb: 'One brand, every platform — banners at correct sizes with effects.',
      desc: 'Pick a platform and format. The Studio opens at precise pixel dimensions with safe zones. Design with floating particles, iridescent gradients, neon grids — then export as PNG at the correct size. Every major platform supported.',
      palette: 'citrus-pop', img: '/inspo/social-kit.webp',
      sections: 'YouTube · X · Instagram · LinkedIn · TikTok · Twitch',
      seed: 'Design a cohesive social media banner set for one brand across YouTube, X, Facebook, LinkedIn, and TikTok using a shared logomark, palette, and type. Output one canvas at a time at the selected platform size. Include floating particle effects or animated gradient backgrounds.' },
    { id: 'g-ecommerce', title: 'DTC Product Store', category: 'Business Landing', type: 'square',
      blurb: 'Hero product shot, social proof, buy CTA — conversion-focused.',
      desc: 'A direct-to-consumer product page: hero with product image + value prop + buy button, social proof strip (ratings, press logos), feature breakdown with icons, size/color selector, upsell section, FAQ, and trust badges footer.',
      palette: 'midnight-synth', img: '/inspo/color-midnight-synth.webp',
      sections: 'Hero · Features · Selector · Upsell · FAQ',
      seed: 'Build a direct-to-consumer product landing page. Hero: product image on left, value prop headline + subhead + buy button + payment icons on right. Social proof strip with ratings and press logos. Feature breakdown with icons and descriptions. Size/color selector with swatches. Upsell section with related products. FAQ accordion. Trust badges in footer. Midnight/purple palette, clean modern type. Responsive.' },
    { id: 'g-event', title: 'Event Conference', category: 'Business Landing', type: 'wide',
      blurb: 'Schedule grid, speaker lineup, ticket CTA — bold and urgent.',
      desc: 'A conference landing page: hero with countdown + "Get tickets" CTA, speaker grid with headshots and bios, day-by-day schedule with session filters, venue info with map, sponsors strip, and ticket tiers with early-bird pricing.',
      palette: 'terracotta-earth', img: '/inspo/color-citrus-pop.webp',
      sections: 'Hero · Speakers · Schedule · Venue · Tickets',
      seed: 'Build a conference event landing page. Hero: event name, date/location, countdown timer, prominent "Get tickets" CTA. Speaker grid with headshots, names, titles, and bio snippets. Day-by-day schedule with session filters by track. Venue info with map and directions. Sponsor logo strip. Three ticket tiers with early-bird pricing and feature comparison. Bold urgent design, terracotta/amber palette. Responsive.' }
  ];

  var COLOR_STORIES = [
    {tag:'Color',title:'Citrus Pop',img:'/inspo/color-citrus-pop.webp',hex:['#1A1411','#FF6B3D','#FFC247','#FFF3E6'],seed:'Use the Citrus Pop palette (energetic tangerine, coral, sunshine) as the design system.'},
    {tag:'Color',title:'Emerald Atelier',img:'/inspo/color-emerald-atelier.webp',hex:['#0E1A14','#1F7A5A','#C8A24A','#F2EDE2'],seed:'Use the Emerald Atelier palette (deep emerald, forest, antique gold) as the design system.'},
    {tag:'Color',title:'Midnight Synth',img:'/inspo/color-midnight-synth.webp',hex:['#0B0B14','#6E57FF','#2BE0E0','#E9E9F5'],seed:'Use the Midnight Synth palette (near-black, electric violet, cyan) as the design system.'},
    {tag:'Color',title:'Terracotta Earth',img:'/inspo/color-terracotta-earth.webp',hex:['#2A1A12','#C0673B','#7E8B57','#F2E7DA'],seed:'Use the Terracotta Earth palette (clay, olive, rust, cream) as the design system.'},
    {tag:'Geode palette',title:'Amethyst Dusk',img:'/inspo/palette-amethyst-dusk.webp',hex:['#1F1512','#AE6146','#732E5B','#F0E3DF'],seed:'Use the Amethyst Dusk palette (obsidian, copper, mulberry, quartz) as the design system.'},
    {tag:'Geode palette',title:'Mineral Cosmos',img:'/inspo/palette-mineral-cosmos.webp',hex:['#12171F','#2E4B73','#572E73','#DFE6F0'],seed:'Use the Mineral Cosmos palette (obsidian, lapis, amethyst, quartz) as the design system.'}
  ];
  var TYPES = [
    {tag:'Type',title:'Brutalist Editorial',img:'/inspo/type-brutalist-editorial.webp',seed:'Apply a brutalist editorial type direction: enormous ultra-condensed grotesque headlines cropped at the edges, asymmetric off-grid layout, a red rule, mono captions.'},
    {tag:'Type',title:'Haute Serif',img:'/inspo/type-haute-serif.webp',seed:'Apply a couture type direction: high-contrast Didone serif display, humanist sans body, generous negative space, quiet luxury.'},
    {tag:'Type',title:'Retro Groove',img:'/inspo/type-retro-groove.webp',seed:'Apply a 1970s retro type direction: plump rounded display on a wavy baseline, warm vintage palette, joyful character.'},
    {tag:'Type',title:'Liquid Chrome',img:'/inspo/type-liquid-chrome.webp',seed:'Apply a Y2K liquid-chrome type direction: glossy liquid-metal 3D letterforms, iridescent reflections, high-gloss futuristic energy.'}
  ];
  var ILLUS = [
    {tag:'Illustrated',title:'Ghibli Dream',img:'/inspo/illus-ghibli.webp',seed:'Apply a Studio Ghibli-style illustrated direction: soft cel-painted textures, luminous pastel skies, gentle volumetric light, whimsical detail.'},
    {tag:'Illustrated',title:'Pen & Colored Ink',img:'/inspo/illus-pen-ink.webp',seed:'Apply a mixed-media illustration direction: fine black pen contour linework with loose colored-ink washes, visible paper texture, editorial energy.'}
  ];

  function hsv(c){var r=c[0]/255,g=c[1]/255,b=c[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0;
    if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;}h=(h*60+360)%360;return[h,mx?d/mx:0,mx];}
  function hsv2rgb(h,s,v){h=((h%360)+360)%360;var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,r,g,b;
    if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
    else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
    return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];}
  function hex(c){return '#'+c.map(function(v){return ('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2);}).join('').toUpperCase();}
  function boost(c){var a=hsv(c);return hsv2rgb(a[0],Math.max(a[1],0.6),Math.min(Math.max(a[2],0.45),0.92));}
  function huedist(a,b){var d=Math.abs(hsv(a)[0]-hsv(b)[0])%360;return Math.min(d,360-d);}
  function nameFromHex(h){var c=[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    var a=hsv(c),H=a[0],s=a[1],v=a[2];
    if(v<0.20)return'Obsidian';if(s<0.12)return'Quartz Veil';
    if(H<18||H>=345)return'Garnet';if(H<45)return v<0.72?'Copper':'Amber';if(H<80)return'Pyrite Gold';
    if(H<160)return'Jade';if(H<200)return'Verdigris';if(H<250)return'Lapis';if(H<300)return'Amethyst';
    return v<0.62?'Mulberry':'Rose Quartz';}

  function samplePalette(img){
    var W=160,H=Math.max(1,Math.round(W*img.naturalHeight/(img.naturalWidth||W)));
    var cv=document.createElement('canvas');cv.width=W;cv.height=H;
    var ctx=cv.getContext('2d');ctx.drawImage(img,0,0,W,H);
    var d=ctx.getImageData(0,0,W,H).data,px=[];
    for(var i=0;i<d.length;i+=4){if(d[i+3]>128)px.push([d[i],d[i+1],d[i+2]]);}
    var withS=px.map(function(p){return[p,hsv(p)[1]];}).sort(function(a,b){return b[1]-a[1];});
    var vivid=withS.slice(0,Math.max(40,Math.floor(px.length*0.15))).map(function(x){return x[0];});
    var fam={};
    vivid.forEach(function(p){var a=hsv(p),f=Math.floor(a[0]/30),sc=a[1]*(0.4+0.6*a[2]);
      if(!fam[f]||sc>fam[f].sc)fam[f]={c:p,sc:sc};});
    var heroes=Object.keys(fam).map(function(k){return fam[k];}).sort(function(a,b){return b.sc-a.sc;}).map(function(x){return x.c;});
    if(!heroes.length)heroes=[[120,120,120]];
    var primary=boost(heroes[0]),accent=null;
    for(var j=1;j<heroes.length;j++){if(huedist(heroes[j],primary)>=45){accent=boost(heroes[j]);break;}}
    if(!accent)accent=boost(heroes[1]||heroes[0]);
    var ph=hsv(primary)[0];
    return [hex(hsv2rgb(ph,0.42,0.12)),hex(primary),hex(accent),hex(hsv2rgb(ph,0.07,0.94))];
  }
  function nameHexes(hexes){
    return fetch(workerBase()+'/api/palette-name',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hexes:hexes})})
      .then(function(r){return r.json();}).then(function(j){return (j.names&&j.names.length===hexes.length)?j.names:hexes.map(nameFromHex);})
      .catch(function(){return hexes.map(nameFromHex);});
  }

  function ingestAuth(){var p=new URLSearchParams(location.search),a=p.get('auth');
    if(a&&a.indexOf('wek_')===0){localStorage.setItem(KEY_API,a);p.delete('auth');
      history.replaceState({},'',location.pathname+(p.toString()?'?'+p:''));}}
  function renderAuth(){var slot=$('#authSlot');if(!slot)return;var k=getKey();
    if(!k){slot.innerHTML='<a class="glz-btn btn-xs" style="padding:6px 14px;font-size:12px" href="/signin.html?redirect='+enc('/inspiration.html')+'">Sign in</a>';return;}
    slot.innerHTML='<span class="credit-pill" id="cpill">credits <b>…</b></span><span class="avatar" title="Account">&#9670;</span>';
    fetch(workerBase()+'/api/balance',{headers:{'x-api-key':k}}).then(function(r){return r.json();}).then(function(b){
      var pill=$('#cpill');if(!pill)return;var bal=(b&&typeof b.balance==='number')?b.balance:0;
      pill.innerHTML='credits <b>'+bal+'</b>';
    }).catch(function(){});}

  function go(seed, briefMd, paletteHex){
    try{sessionStorage.setItem('dipdesigns_pending_brief',JSON.stringify({briefMd:briefMd||'',seed:seed||'',palette:paletteHex||null,nobreak:false,ts:Date.now()}));}catch(e){}
    var url='/studio?brief=local';
    if(seed)url+='&prompt='+enc(seed.slice(0,1600));
    location.href=url;
  }
  function createBrief(card){
    var paletteHex=card.palette&&PALETTES[card.palette]?PALETTES[card.palette].hex:null;
    var k=getKey();var body={itemId:card.id,nobreak:false};if(!card.id&&paletteHex)body.palette={base_hex:paletteHex[0],primary_hex:paletteHex[1],accent_hex:paletteHex[2],surface_hex:paletteHex[3],name:(card.title||'Custom')};
    var headers={'Content-Type':'application/json'};if(k)headers['x-api-key']=k;
    fetch(workerBase()+'/api/brief',{method:'POST',headers:headers,body:JSON.stringify(body)})
      .then(function(r){return r.ok?r.json():Promise.reject();})
      .then(function(j){go((j.seed&&j.seed.prompt)||card.seed,j.briefMd,paletteHex);})
      .catch(function(){go(card.seed,'',paletteHex);});
  }
  function openStudio(prompt){if(prompt)go(prompt,'',null);else location.href='/studio';}

  function generateThumbnail(){
    var btn=$('#genThumbBtn');if(!btn)return;
    var topic=$('#thumbTopic').value.trim();if(!topic){alert('Enter a video topic');return;}
    var title=$('#thumbTitle').value.trim();
    btn.disabled=true;btn.textContent='Generating…';
    var k=getKey();
    if(!k){k=prompt('Sign in required. Paste your wek_ key (or enter "free" to try once):');if(!k){btn.disabled=false;btn.textContent='Generate Thumbnail (1 credit)';return;}}
    fetch(workerBase()+'/api/thumbnail',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':k},
      body:JSON.stringify({topic:topic,title:title||topic})
    }).then(function(r){return r.json();}).then(function(j){
      btn.disabled=false;btn.textContent='Generate Thumbnail (1 credit)';
      if(j.error){alert(j.error);return;}
      var res=$('#thumbResult');if(!res)return;
      res.style.display='block';
      var img=$('#thumbImg');if(img)img.src=j.thumbnail_url;
      var dl=$('#downloadThumbBtn');
      if(dl){
        dl.onclick=function(){
          // Safe URL already has 8% margin baked in via server-side trim+pad
          // Download the full 1280x720 image as-is
          var a=document.createElement('a');
          a.download=topic.slice(0,50).replace(/[^a-z0-9]/gi,'_')+'_thumbnail.png';
          a.href=j.thumbnail_url;
          // For raw URLs (no R2 processing), fall back to canvas with padding
          if (j.thumbnail_url === j.raw_url) {
            var c=document.createElement('canvas');c.width=1280;c.height=720;
            var ctx=c.getContext('2d');
            var i=new Image();i.crossOrigin='anonymous';
            i.onload=function(){
              ctx.fillStyle='#000';ctx.fillRect(0,0,1280,720);
              ctx.drawImage(i,102,102,1076,516);
              a.href=c.toDataURL('image/png');a.click();
            };
            i.src=j.thumbnail_url;
            return;
          }
          // For processed URLs (R2), download directly
          fetch(j.thumbnail_url).then(function(r){return r.blob();}).then(function(b){
            a.href=URL.createObjectURL(b);a.click();
            setTimeout(function(){URL.revokeObjectURL(a.href);},10000);
          });
        };
      }
    }).catch(function(err){
      btn.disabled=false;btn.textContent='Generate Thumbnail (1 credit)';
      alert('Error: '+err.message);
    });
  }

  function renderFeatures(){
    var grid=$('#featureGrid');if(!grid)return;
    grid.innerHTML=FEATURES.map(function(f){
      var cls='badge '+f.tagType;
      return '<div class="feat-card" data-id="'+f.id+'">'+
        '<div class="row">'+
          '<span class="'+cls+'">'+f.tag+'</span>'+
          '<div class="body"><h3>'+f.title+'</h3><p>'+f.desc+'</p></div>'+
          '<div class="arrow">&#8594;</div>'+
        '</div></div>';
    }).join('');
    $$('.feat-card').forEach(function(el){
      el.addEventListener('click',function(){openFeatureDrawer(el.getAttribute('data-id'));});
      el.addEventListener('keydown',function(e){if(e.key==='Enter')openFeatureDrawer(el.getAttribute('data-id'));});
    });
  }

  function renderGallery(){
    var grid=$('#galleryGrid');if(!grid)return;
    grid.innerHTML=GALLERY.map(function(g){
      var cls='gallery-card'+(g.type==='wide'?' wide':'');
      return '<div class="'+cls+'" data-id="'+g.id+'" tabindex="0" role="button" aria-label="'+g.title+'">'+
        '<div class="g-img-wrap"><img class="g-img" src="'+g.img+'" alt="'+g.title+'" loading="lazy"></div>'+
        '<div class="g-overlay">'+
          '<span class="g-cat">'+g.category+'</span>'+
          '<div class="g-title">'+g.title+'</div>'+
          '<div class="g-blurb">'+g.blurb+'</div>'+
          '<span class="g-action">View details &#8594;</span>'+
        '</div></div>';
    }).join('');
    grid.querySelectorAll('.gallery-card').forEach(function(el){
      el.addEventListener('click',function(){openGalleryDrawer(el.getAttribute('data-id'));});
      el.addEventListener('keydown',function(e){if(e.key==='Enter')openGalleryDrawer(el.getAttribute('data-id'));});
    });
  }

  function openGalleryDrawer(id){
    var g=GALLERY.find(function(x){return x.id===id;});if(!g)return;
    var d=$('#drawer'),ov=$('#drawerOverlay'),dc=$('#drawerContent');lastFocus=document.activeElement;
    var pal=g.palette&&PALETTES[g.palette];
    var hexChips='';
    if(pal){
      hexChips='<div class="glz-divider" style="margin-top:4px">PALETTE</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
        pal.hex.map(function(h,i){var lt=parseInt(h.slice(1,3),16)*0.3+parseInt(h.slice(3,5),16)*0.59+parseInt(h.slice(5,7),16)*0.11;
          return '<div class="pal-chip" data-idx="'+i+'" style="display:flex;align-items:center;gap:6px;background:var(--glass-2);border:1px solid var(--line);border-radius:var(--r-md);padding:6px 10px;font-size:11px;cursor:pointer;transition:var(--t)">'+
            '<span style="width:16px;height:16px;border-radius:4px;background:'+h+';flex-shrink:0;border:1px solid rgba(255,255,255,.06)"></span>'+
            '<span style="color:var(--ink);font-weight:600">'+ROLES[i]+'</span>'+
            '<span style="font-family:var(--font-mono);color:var(--ink-dim)">'+h+'</span></div>';}).join('')+'</div>';
    }
    var previewHTML='';
    if(pal){
      previewHTML='<div class="glz-divider" style="margin-top:16px">LIVE PREVIEW</div>'+
        '<div class="d-preview"><div class="mini" id="miniPreview">'+
          '<div class="mh"><span class="dot"></span><span class="pillbtn">Start free</span></div>'+
          '<h4>'+g.title+'</h4><div class="ln s"></div><div class="ln t"></div><div class="cards"><b></b><b></b><b></b></div>'+
        '</div></div>'+
        '<div class="d-body"><div class="seg" id="previewMode"><button data-m="dark" class="on">Dark</button><button data-m="light">Light</button></div></div>';
    }
    var html='<div class="d-tag" style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--teal);margin-bottom:6px">'+g.category+'</div>'+
      '<h3 style="font-size:clamp(22px,3vw,30px);font-weight:800;letter-spacing:-.5px;margin:0 0 6px">'+g.title+'</h3>'+
      '<p class="d-desc" style="font-size:14px;line-height:1.6;color:var(--ink-dim);margin:0 0 10px">'+g.desc+'</p>'+
      hexChips+previewHTML+
      '<div class="glz-divider" style="margin-top:0">SECTIONS</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">'+
        g.sections.split(' · ').map(function(s){return '<span style="font-family:var(--font-mono);font-size:10px;letter-spacing:1px;background:rgba(63,224,208,.08);border:1px solid rgba(63,224,208,.15);color:var(--teal);padding:4px 10px;border-radius:12px">'+s+'</span>';}).join('')+
      '</div>'+
      '<button class="glz-btn glz-btn-primary glz-btn-block" id="gBriefBtn">Create brief &#8594; Studio</button>';
    dc.innerHTML=html;
    d.classList.add('open');ov.classList.add('open');$('#dClose').focus();

    if(pal){
      var pObj={base:pal.hex[0],primary:pal.hex[1],accent:pal.hex[2],surface:pal.hex[3]};
      var previewMode='dark';
      function updatePreview(){
        var el=$('#miniPreview');if(!el)return;
        applyTo(el,deriveTheme(pObj,previewMode));
      }
      updatePreview();
      var seg=$('#previewMode');
      if(seg)seg.addEventListener('click',function(e){
        var b=e.target.closest('button');if(!b)return;
        previewMode=b.dataset.m;
        Array.prototype.forEach.call(seg.children,function(x){x.classList.toggle('on',x===b);});
        updatePreview();
      });
    }

    $('#gBriefBtn').addEventListener('click',function(){closeDrawer();createBrief(g);});
  }

  var lastFocus=null;
  function openFeatureDrawer(id){
    var f=FEATURES.find(function(x){return x.id===id;});if(!f)return;
    var d=$('#drawer'),ov=$('#drawerOverlay'),dc=$('#drawerContent');lastFocus=document.activeElement;
    var tagClass='badge '+f.tagType;
    var html='<div class="d-tag"><span class="'+tagClass+'">'+f.tag+'</span></div>'+
      '<h3>'+f.title+'</h3><p class="d-desc">'+f.detail+'</p><div class="d-body">';

    if(f.action==='picker'){
      html+='<div class="glz-divider">PLATFORM</div><div class="platform-grid" id="pltGrid"></div><div id="fmtList" class="format-list" style="margin-top:12px"></div>';
    } else if(f.action==='scroll'){
      html+='<button class="glz-btn glz-btn-primary glz-btn-block" id="featAction">Try it now &#8595;</button>';
    } else {
      html+='<button class="glz-btn glz-btn-primary glz-btn-block" id="featAction">Open in Studio &#8594;</button>';
    }
    html+='</div>';
    dc.innerHTML=html;
    d.classList.add('open');ov.classList.add('open');$('#dClose').focus();

    if(f.action==='picker'){
      renderPlatformPicker();
    } else if(f.action==='scroll'){
      $('#featAction').addEventListener('click',function(){closeDrawer();setTimeout(function(){var s=document.getElementById(f.target);if(s)s.scrollIntoView({behavior:'smooth',block:'start'});},300);});
    } else if(f.href){
      $('#featAction').addEventListener('click',function(){closeDrawer();location.href=f.href;});
    }
  }

  function renderPlatformPicker(){
    var by=presetsByPlatform();var grid=$('#pltGrid');if(!grid)return;
    var platforms=Object.keys(by);
    grid.innerHTML=platforms.map(function(p){return '<button class="plat-btn" data-platform="'+p+'">'+p+'</button>';}).join('');
    $$('.plat-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        $$('.plat-btn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        renderFormats(btn.getAttribute('data-platform'));
      });
    });
    if(platforms.length)renderFormats(platforms[0]);
  }
  function renderFormats(platform){
    var list=$('#fmtList');if(!list)return;
    var presets=SOCIAL_PRESETS.filter(function(p){return p.platform===platform;});
    if(!presets.length){list.innerHTML='';return;}
    list.innerHTML=presets.map(function(p){
      var note=p.note||p.safe||'';
      return '<button class="fmt-btn" data-w="'+p.w+'" data-h="'+p.h+'" data-format="'+p.format+'" data-platform="'+p.platform+'">'+
        p.format+'<span class="dim">'+p.w+' &#215; '+p.h+'px'+(p.ratio?' &middot; '+p.ratio:'')+'</span>'+
        (note?'<span class="note">'+note+'</span>':'')+'</button>';
    }).join('');
    $$('.fmt-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var w=btn.getAttribute('data-w'),h=btn.getAttribute('data-h');
        var pf=btn.getAttribute('data-platform'),fm=btn.getAttribute('data-format');
        if (fm === 'Video Thumbnail') {
          var list=$('#fmtList');
          list.innerHTML='<div style="margin-top:8px"><p style="font-size:13px;color:var(--ink-dim);margin:0 0 12px">Enter your video topic and title. AI generates a 1280x720 thumbnail with safe-zone enforced text.</p>'+
            '<input id="thumbTopic" placeholder="Video topic (e.g. Why Edge Computing wins)" style="width:100%;padding:10px 14px;background:var(--glass-2);border:1px solid var(--line);border-radius:var(--r-md);color:var(--ink);font-size:14px;margin-bottom:8px;box-sizing:border-box">'+
            '<input id="thumbTitle" placeholder="Video title (optional)" style="width:100%;padding:10px 14px;background:var(--glass-2);border:1px solid var(--line);border-radius:var(--r-md);color:var(--ink);font-size:14px;margin-bottom:12px;box-sizing:border-box">'+
            '<button class="glz-btn glz-btn-primary glz-btn-block" id="genThumbBtn" style="margin-bottom:12px">Generate Thumbnail (1 credit)</button>'+
            '<div id="thumbResult" style="display:none"><div style="position:relative;width:100%;aspect-ratio:1280/720;background:#000;border-radius:var(--r-md);overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:8px">'+
              '<img id="thumbImg" style="width:84%;height:84%;object-fit:contain" alt="thumbnail"></div>'+
            '<button class="glz-btn" id="downloadThumbBtn">Download PNG</button></div>';
          $('#genThumbBtn').addEventListener('click',function(){generateThumbnail();});
          return;
        }
        var prompt='Design a '+pf+' '+fm+' banner at '+w+'x'+h+'px. Use the Glazier design system: dark background, teal accents. Make it stunning.';
        if(w>=1500)prompt+=' Include a particle effect or animated gradient background.';
        go(prompt,'',null);
      });
    });
    $$('.plat-btn').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-platform')===platform);});
  }

  function renderChips(hexes,names){
    var wrap=$('#chips');if(!wrap)return;wrap.style.display='flex';
    wrap.innerHTML=hexes.map(function(h,i){var light=parseInt(h.slice(1,3),16)*0.3+parseInt(h.slice(3,5),16)*0.59+parseInt(h.slice(5,7),16)*0.11;
      var rc=light>140?'#000':'#fff';
      return '<div class="chip"><div class="sw" style="background:'+h+'"><span class="role" style="background:'+(light>140?'#0008':'#fff8')+';color:'+rc+'">'+ROLES[i]+'</span></div>'+
        '<div class="lab"><div class="nm">'+(names[i]||'')+'</div><div class="hx">'+h+'</div></div></div>';}).join('');
    var pa=$('#palActions');if(pa)pa.style.display='flex';
  }
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
  function initPaletteEngine(){
    var dz=$('#dropzone'),fi=$('#fileInput');if(!dz)return;
    dz.addEventListener('click',function(){fi.click();});
    fi.addEventListener('change',function(){if(fi.files[0])handleImage(fi.files[0]);});
    ['dragenter','dragover'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add('drag');});});
    ['dragleave','drop'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove('drag');});});
    dz.addEventListener('drop',function(e){var f=e.dataTransfer.files[0];if(f)handleImage(f);});
  }

  function cardHTML(it){
    return '<div class="card" tabindex="0"><div class="ph"><img loading="lazy" src="'+it.img+'" alt="'+it.title+'"></div>'+
      '<div class="meta"><div class="tag">'+it.tag+'</div><h3>'+it.title+'</h3></div>'+
      '<div class="ov"><p>'+(it.desc||it.title)+'</p><div class="btnrow"><button class="glz-btn primary btn-xs act">'+(it.hex?'Use palette →':'Create brief →')+'</button></div></div></div>';
  }
  function fillRail(sel,arr){
    var r=$(sel);
    if(!r)return;
    r.innerHTML=arr.map(cardHTML).join('');
    Array.prototype.forEach.call(r.children,function(el,i){var it=arr[i];if(!it)return;
      el.querySelector('.act').addEventListener('click',function(e){e.stopPropagation();createBriefFromItem(it);});
      el.addEventListener('click',function(){createBriefFromItem(it);});
    });
  }
  function createBriefFromItem(it){
    var k=getKey();
    var body={nobreak:false,seed:it.seed};
    if(it.hex)body.palette={name:it.title,base_hex:it.hex[0],primary_hex:it.hex[1],accent_hex:it.hex[2],surface_hex:it.hex[3]};
    var h={'Content-Type':'application/json'};if(k)h['x-api-key']=k;
    fetch(workerBase()+'/api/brief',{method:'POST',headers:h,body:JSON.stringify(body)})
      .then(function(r){return r.ok?r.json():Promise.reject();})
      .then(function(j){go((j.seed&&j.seed.prompt)||it.seed,it.hex||null);})
      .catch(function(){go(it.seed,it.hex||null);});
  }

  function hx(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  function toHex(c){return '#'+c.map(function(v){return ('0'+Math.round(Math.max(0,Math.min(255,v))).toString(16)).slice(-2);}).join('');}
  function lin(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}
  function L(c){return .2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);}
  function ratio(a,b){var la=L(a)+.05,lb=L(b)+.05;return la>lb?la/lb:lb/la;}
  function mix(a,b,t){return a.map(function(v,i){return v+(b[i]-v)*t;});}
  function bestText(bg){var d=[14,17,22],l=[246,248,251];return ratio(bg,d)>=ratio(bg,l)?d:l;}
  function onAccent(c){return L(c)>.45?'#11151b':'#ffffff';}
  function deriveTheme(p,mode){
    var base=hx(p.base),prim=hx(p.primary),acc=hx(p.accent),surf=hx(p.surface);
    var ends=[base,prim,acc,surf].sort(function(a,b){return L(a)-L(b);});
    var darkest=ends[0],lightest=ends[3];
    var bg=mode==='dark'?darkest:lightest;
    var surface=mode==='dark'?mix(bg,[255,255,255],.08):mix(bg,[255,255,255],.45);
    var text=bestText(bg);
    return {'--c-bg':toHex(bg),'--c-surface':toHex(surface),'--c-text':toHex(text),'--c-text-dim':toHex(mix(text,bg,.42)),'--c-accent':toHex(prim),'--c-accent-2':toHex(acc),'--c-line':toHex(mix(text,bg,.82)),'--c-on-accent':onAccent(prim)};
  }
  function applyTo(el,tokens){for(var k in tokens)el.style.setProperty(k,tokens[k]);}

  function closeDrawer(){$('#drawer').classList.remove('open');$('#drawerOverlay').classList.remove('open');if(lastFocus)lastFocus.focus();}

  function init(){
    ingestAuth();renderAuth();
    renderFeatures();
    renderGallery();
    fillRail('#colorRail',COLOR_STORIES);
    fillRail('#typeRail',TYPES);
    fillRail('#illusRail',ILLUS);
    initPaletteEngine();
    renderMyPalettes();
    $('#drawerOverlay').addEventListener('click',closeDrawer);
    $('#dClose').addEventListener('click',closeDrawer);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer();});
    var hf=$('#heroForm');if(hf)hf.addEventListener('submit',function(e){e.preventDefault();var v=$('#heroPrompt').value.trim();location.href='/studio'+(v?'?prompt='+enc(v):'');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
