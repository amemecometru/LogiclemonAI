// DipDesigns · worker/assets/social-presets.js
// Single source of truth for the Social Media Studio canvas presets.
// Verified June 2026 dimensions. The Studio opens on { w, h } for the chosen
// preset; `safe` marks the text/logo-safe area for banners. Backend persistence
// of exported banners is a LATER build (out of scope for the Inspiration page).
var SOCIAL_PRESETS = [
  // platform, format, pixels, ratio, optional safe area / note
  { platform: 'YouTube',  format: 'Channel Banner', w: 2560, h: 1440, ratio: '16:9',   safe: '1546x423 centered; min 2048x1152; <=6MB' },
  { platform: 'YouTube',  format: 'Profile',        w: 800,  h: 800,  ratio: '1:1',     note: 'circle crop' },
  { platform: 'X',        format: 'Header',         w: 1500, h: 500,  ratio: '3:1',     note: 'avatar overlays lower-left; keep ~60px top/bottom clear' },
  { platform: 'X',        format: 'Profile',        w: 400,  h: 400,  ratio: '1:1',     note: 'circle crop' },
  { platform: 'Facebook', format: 'Page Cover',     w: 851,  h: 315,  ratio: '~2.7:1',  note: 'mobile renders 640x360; center-safe' },
  { platform: 'Facebook', format: 'Profile',        w: 320,  h: 320,  ratio: '1:1',     note: 'circle' },
  { platform: 'Instagram',format: 'Portrait Post',  w: 1080, h: 1350, ratio: '4:5' },
  { platform: 'Instagram',format: 'Square Post',    w: 1080, h: 1080, ratio: '1:1' },
  { platform: 'Instagram',format: 'Story / Reel',   w: 1080, h: 1920, ratio: '9:16',    safe: 'reserve ~250px top / ~220px bottom for UI' },
  { platform: 'LinkedIn', format: 'Personal Banner',w: 1584, h: 396,  ratio: '4:1',     note: 'mobile shows center 1128x396' },
  { platform: 'LinkedIn', format: 'Company Cover',  w: 1128, h: 191,  ratio: '~5.9:1',  note: 'keep text centered' },
  { platform: 'TikTok',   format: 'Video / Cover',  w: 1080, h: 1920, ratio: '9:16' },
  { platform: 'TikTok',   format: 'Profile',        w: 200,  h: 200,  ratio: '1:1',     note: 'upload larger; downscales' },
  { platform: 'Twitch',   format: 'Channel Banner', w: 1200, h: 480,  ratio: '2.5:1' },
  { platform: 'Twitch',   format: 'Offline Banner', w: 1920, h: 1080, ratio: '16:9' },
  { platform: 'Pinterest',format: 'Standard Pin',   w: 1000, h: 1500, ratio: '2:3' },
  { platform: 'YouTube',  format: 'Video Thumbnail', w: 1280, h: 720,  ratio: '16:9',   note: '8% safe margin (102px) all edges — text inside 1075x605 zone' },
];

// group helper for rendering the picker by platform
function presetsByPlatform() {
  return SOCIAL_PRESETS.reduce((m, p) => ((m[p.platform] ||= []).push(p), m), {});
}
