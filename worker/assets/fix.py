import re

with open('studio.html', 'r') as f:
    c = f.read()

# 1. White canvas → light grey
c = c.replace('background:#fff;border-radius:6px', 'background:#e8e8ec;border-radius:6px')

# 2. Handoff pill → top-left (out of zoom/device button way)
c = c.replace('.handoff-trigger{position:absolute;left:16px;bottom:16px;', '.handoff-trigger{position:absolute;left:16px;top:16px;')

# 3. Add Great Vibes cursive font
c = c.replace(
    'family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">',
    'family=Space+Mono:wght@400;700&family=Great+Vibes&display=swap" rel="stylesheet">'
)

# 4. Add cursive CSS + empty-state HTML
css = '''.preview-canvas{flex:1;overflow:auto;display:grid;background:var(--bg-void);-webkit-overflow-scrolling:touch;position:relative;}
.preview-empty-brand{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;opacity:0;transition:opacity .4s var(--ease);}
.preview-empty-brand.visible{opacity:1;}
.cursive-dip{font-family:'Great Vibes',cursive;font-size:clamp(48px,8vw,120px);color:rgba(10,14,22,0.08);letter-spacing:2px;transform:rotate(-3deg);user-select:none;}'''
c = c.replace(
    '.preview-canvas{flex:1;overflow:auto;display:grid;background:var(--bg-void);-webkit-overflow-scrolling:touch;}',
    css
)
c = c.replace(
    '<iframe id="preview" sandbox="allow-scripts allow-same-origin" title="Live Preview"></iframe>',
    '<iframe id="preview" sandbox="allow-scripts allow-same-origin" title="Live Preview"></iframe>\n              <div class="preview-empty-brand" id="previewEmptyBrand"><div class="cursive-dip">DipDesigns.app</div></div>'
)

with open('studio.html', 'w') as f:
    f.write(c)

print('Done. 4 fixes applied.')
