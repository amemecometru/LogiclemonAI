# Tokyo-Night Color Scheme — DipDesigns Design System

## Overview
A deep indigo-blue night palette with bright cyan, purple, and orange accents. Inspired by the Tokyo-Night VS Code theme. Use for dashboards, creative tools, and developer-focused interfaces.

## Color Tokens

### Canvas
```
--bg-night:        #0f111b;
--bg-base:         #141620;
--bg-raise:        #1a1c2b;
```

### Surfaces
```
--surface-1:       #1f2235;
--surface-2:       #252840;
--surface-3:       #2c2f4a;
--border:          #363b54;
```

### Accents
```
--cyan:            #7dcfff;
--cyan-soft:       rgba(125, 207, 255, 0.35);
--blue:            #82aaff;
--blue-soft:       rgba(130, 170, 255, 0.30);
--purple:          #bb9af7;
--purple-soft:     rgba(187, 154, 247, 0.30);
--orange:          #ff9e64;
--orange-soft:     rgba(255, 158, 100, 0.30);
--green:           #9ece6a;
--red:             #f7768e;
```

### Text
```
--ink:             #c0caf5;
--ink-dim:         #737aa2;
--ink-bright:      #e1e6ff;
```

### Example Card Surface
```css
.glass-night {
  background: linear-gradient(160deg, rgba(31, 34, 53, 0.82), rgba(26, 28, 43, 0.76));
  border: 1px solid rgba(54, 59, 84, 0.5);
  border-radius: 14px;
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

## Typography
- Font UI: `'Outfit', system-ui, -apple-system, sans-serif`
- Font Mono: `'Space Mono', ui-monospace, 'SF Mono', monospace`
- Scale: 12 / 13 / 14 / 16 / 20 / 24 / 32 / 48

## Spacing
- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

## Radius
- --r-sm: 6px; --r-md: 10px; --r-lg: 16px; --r-pill: 999px;

## Usage
Apply `.tokyo-bg` for the canvas, `.tokyo-glass` for card surfaces, and accent classes (`.tokyo-cyan`, `.tokyo-purple`, etc.) for highlights. This palette pairs best with dark UI elements and bright neon glow effects.

## Export
Build the full design system as HTML/CSS in DipDesigns Studio. Use the prompt: "Build a UI using Tokyo-Night color scheme with indigo-black background #0f111b, cyan #7dcfff accent, purple #bb9af7 secondary, orange #ff9e64 highlights, and glass-morphism cards on surface #1a1c2b."
