import sharp from "sharp";

export const CATEGORY_SIZE = 1024;

/** ROVEXO brand palette — blue / white studio identity */
export const ROVEXO = {
  blue: "#2563eb",
  blueDark: "#1e40af",
  blueDeep: "#1e3a8a",
  white: "#f8fafc",
  silver: "#e2e8f0",
  slate: "#64748b",
  ink: "#0f172a",
};

export async function rasterTransparent(svgOrBuffer, width, height) {
  return sharp(Buffer.isBuffer(svgOrBuffer) ? svgOrBuffer : Buffer.from(svgOrBuffer))
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

export async function addGrain(buffer, intensity = 0.038) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? CATEGORY_SIZE;
  const h = meta.height ?? CATEGORY_SIZE;
  const noise = await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 128, g: 128, b: 128 } },
  })
    .png()
    .blur(0.35)
    .toBuffer();

  return sharp(buffer)
    .composite([{ input: noise, blend: "overlay", opacity: intensity }])
    .png()
    .toBuffer();
}

export async function polishCategoryMaster(buffer) {
  return addGrain(
    await sharp(buffer)
      .modulate({ brightness: 1.02, saturation: 1.04 })
      .png()
      .toBuffer(),
    0.032,
  );
}

export function categoryFrame(defs, body, scale = 0.82, y = 470) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>${defs}</defs>
  <g transform="translate(512 ${y}) scale(${scale})">${body}</g>
</svg>`;
}

export function sharedCategoryDefs(id) {
  return `
    <linearGradient id="${id}-rx" x1="12%" y1="0%" x2="88%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="42%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="${id}-metal" x1="18%" y1="0%" x2="82%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="32%" stop-color="#f1f5f9"/>
      <stop offset="68%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="${id}-spec" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="35%" cy="18%" r="58%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}-sh" x="-55%" y="-55%" width="210%" height="210%">
      <feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.32"/>
    </filter>
    <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
}
