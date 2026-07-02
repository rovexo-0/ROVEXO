import sharp from "sharp";

export const CATEGORY_SIZE = 1024;
export const HERO_W = 1920;
export const HERO_H = 1080;

const STUDIO = {
  blue: ["#0a1628", "#0f2744", "#1e3a8a", "#2563eb"],
  violet: ["#120a24", "#2e1065", "#5b21b6", "#7c3aed"],
  emerald: ["#071510", "#064e3b", "#047857", "#10b981"],
  cyan: ["#071820", "#0e4f6e", "#0891b2", "#06b6d4"],
  indigo: ["#0c1020", "#312e81", "#4338ca", "#6366f1"],
  gold: ["#1a1208", "#78350f", "#b45309", "#f59e0b"],
};

export function studioTheme(key) {
  return STUDIO[key] ?? STUDIO.blue;
}

/** Rasterize inline markup to transparent PNG buffer */
export async function rasterTransparent(svgOrBuffer, width, height) {
  return sharp(Buffer.isBuffer(svgOrBuffer) ? svgOrBuffer : Buffer.from(svgOrBuffer))
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Subtle film grain for photographic depth */
export async function addGrain(buffer, intensity = 0.045) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? HERO_W;
  const h = meta.height ?? HERO_H;
  const noise = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 128, g: 128, b: 128 } },
  })
    .png()
    .modulate({ brightness: 1, saturation: 0 })
    .blur(0.3)
    .toBuffer();

  return sharp(buffer)
    .composite([{ input: noise, blend: "overlay", opacity: intensity }])
    .png()
    .toBuffer();
}

export async function dropShadow(buffer, blur = 28, opacity = 0.32) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 256;
  const h = meta.height ?? 256;
  const shadow = await sharp(buffer)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(blur)
    .toColourspace("b-w")
    .toBuffer();

  const shadowRgba = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: shadow, blend: "over", opacity }])
    .png()
    .toBuffer();

  return sharp(shadowRgba).png().toBuffer();
}

export async function compositeLayers(baseBuffer, layers) {
  return sharp(baseBuffer).composite(layers).png().toBuffer();
}

export function categoryFrame(defs, body, scale = 0.82, y = 470) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>${defs}</defs>
  <g transform="translate(512 ${y}) scale(${scale})">${body}</g>
</svg>`;
}

export function sharedCategoryDefs(id) {
  return `
    <linearGradient id="${id}-metal" x1="18%" y1="0%" x2="82%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#e2e8f0"/>
      <stop offset="72%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="${id}-spec" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}-sh" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.28"/>
    </filter>
    <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
}

export async function buildStudioBackground(themeKey, vignetteLeft = 0.58) {
  const [a, b, c, d] = studioTheme(themeKey);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${HERO_W}" height="${HERO_H}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${a}"/>
        <stop offset="45%" stop-color="${b}"/>
        <stop offset="78%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${d}"/>
      </linearGradient>
      <radialGradient id="spot" cx="82%" cy="38%" r="52%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="vig" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#020617" stop-opacity="${vignetteLeft}"/>
        <stop offset="38%" stop-color="#020617" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="floor" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#spot)"/>
    <ellipse cx="960" cy="980" rx="780" ry="180" fill="url(#floor)"/>
    <rect width="100%" height="100%" fill="url(#vig)"/>
  </svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  return addGrain(base, 0.035);
}

export async function placeProduct(buffer, left, top, size, rotate = 0, shadow = true) {
  const resized = await sharp(buffer)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? size;
  const h = meta.height ?? size;

  const layers = [];
  if (shadow) {
    const sh = await dropShadow(resized, Math.round(size * 0.08), 0.28);
    layers.push({ input: sh, left: left + Math.round(size * 0.03), top: top + Math.round(size * 0.06) });
  }
  layers.push({ input: resized, left, top });
  return { layers, width: w, height: h };
}

export async function buildCardboardBox(left, top, w, h, label = "ROVEXO") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <rect x="8" y="18" width="${w - 16}" height="${h - 26}" rx="18" fill="url(#c)"/>
    <path d="M8 36 L${w / 2} 18 L${w - 8} 36" fill="#e2e8f0"/>
    <text x="${w / 2}" y="${h / 2 + 8}" text-anchor="middle" fill="#2563eb" font-family="Segoe UI,Arial,sans-serif" font-size="${Math.round(w * 0.09)}" font-weight="800">${label}</text>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const sh = await dropShadow(buf, 16, 0.25);
  return [
    { input: sh, left: left + 8, top: top + 10 },
    { input: buf, left, top },
  ];
}
