# Dark-Blue Glazier — Aether Studio Color Scheme

## Overview
A deep ocean-blue evolution of the Glazier Kit. Deeper blues, brighter cyan edges, heavier glass. Designed for Aether Studio's high-fidelity workspace where signal density meets premium chrome.

## Color Tokens

### Canvas
```
--bg-abyss:       #060b14;
--bg-base:        #0a1224;
--bg-raise:       #0f1b32;
```

### Glazier Blue (The Glass)
```
--glazier-1:      #123456;
--glazier-2:      #0a1e3d;
--glazier-edge:   #1e90ff;
--glazier-deep:   #061a33;
--glazier-glass-1: rgba(18, 52, 86, 0.80);
--glazier-glass-2: rgba(10, 30, 61, 0.74);
```

### Brushed Metal (Silver)
```
--metal-hi:       #e8edf5;
--metal-1:        #c8d2e0;
--metal-2:        #a8b6c8;
--metal-3:        #889bb0;
--metal-4:        #6a7f96;
--metal-lo:       #4a5f76;
```

### Electric Accent
```
--teal:           #00d4ff;
--teal-bright:    #4de8ff;
--teal-ink:       #0088aa;
--teal-soft:      rgba(0, 212, 255, 0.40);
--teal-faint:     rgba(0, 212, 255, 0.12);
```

### Secondary Accents
```
--amber:          #f0b429;
--ember:          #ff5a4a;
--purple-accent:  #8b5cf6;
```

### Text
```
--ink-on-dark:     #e0e8f0;
--ink-on-dark-dim: #8090a8;
--ink-on-metal:    #0a0e18;
--ink-on-metal-dim:#1e2a3a;
```

### Hairlines
```
--line-dark:      rgba(30, 144, 255, 0.14);
--line-metal:     rgba(255, 255, 255, 0.5);
```

## Example Card Surface
```css
.glz-surface-glass-aether {
  background: linear-gradient(160deg, var(--glazier-glass-1), var(--glazier-glass-2));
  backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid var(--line-dark);
  border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0, 0, 0, 0.55);
}
```

## Typography
- Font UI: `'Outfit', system-ui, -apple-system, sans-serif`
- Font Mono: `'Space Mono', ui-monospace, 'SF Mono', monospace`
- Scale: 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48

## Spacing
- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

## Radius
- --r-sm: 8px; --r-md: 14px; --r-lg: 20px; --r-pill: 999px;

## Usage
Apply `.aether-glass` for card surfaces, `.aether-metal` for brushed chrome elements, and `.aether-glow` for the electric teal (#00d4ff) accent glow. This palette excels in professional developer tools, crypto dashboards, and creative studios where premium aesthetics matter.

## Export
Build the full design system as HTML/CSS in DipDesigns Studio. Use the prompt: "Build a UI using Dark-Blue Glazier (Aether Studio) color scheme with deep navy background #0a1224, electric teal #00d4ff accent, brushed silver metal surfaces, glass-morphism cards with backdrop-filter blur, and neon cyan glow effects."
