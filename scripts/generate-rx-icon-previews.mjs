/**
 * RX icon polish preview composites (local QA — not shipped).
 * Run: node scripts/generate-rx-icon-previews.mjs
 */
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "reports", "rx-icon-polish-previews");
const src = join(root, "public", "icons", "icon-512.png");

mkdirSync(outDir, { recursive: true });

async function sizeLadder() {
  const sizes = [32, 48, 64, 128, 256, 512];
  const tiles = [];
  let x = 24;
  const canvasH = 580;
  for (const s of sizes) {
    const buf = await sharp(src).resize(s, s).png().toBuffer();
    tiles.push({ input: buf, left: x, top: Math.round((canvasH - s) / 2) });
    x += s + 28;
  }
  await sharp({
    create: { width: x + 8, height: canvasH, channels: 3, background: { r: 246, g: 247, b: 250 } },
  })
    .composite(tiles)
    .png()
    .toFile(join(outDir, "size-ladder.png"));
  console.log("✓ size-ladder.png");
}

async function splashPreview() {
  const mark = await sharp(src).resize(160, 160).png().toBuffer();
  const word = await sharp(
    Buffer.from(`<svg width="360" height="120" xmlns="http://www.w3.org/2000/svg">
      <text x="180" y="48" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-size="36" font-weight="800" fill="#0B1220">ROV<tspan fill="#7C3AED">X</tspan>O</text>
      <text x="180" y="86" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="3" fill="#64748B">BUY. SELL. GROW.</text>
    </svg>`),
  )
    .png()
    .toBuffer();

  await sharp({
    create: { width: 390, height: 844, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: mark, top: 280, left: 115 },
      { input: word, top: 460, left: 15 },
    ])
    .png()
    .toFile(join(outDir, "05-splash-preview.png"));
  console.log("✓ 05-splash-preview.png");
}

async function phoneFrame(name, width, height, bezel, screenBg) {
  const iconSize = Math.round(width * 0.18);
  const icon = await sharp(src).resize(iconSize, iconSize).png().toBuffer();
  const frame = await sharp({
    create: { width, height, channels: 3, background: bezel },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: width - 24,
            height: height - 24,
            channels: 3,
            background: screenBg,
          },
        })
          .png()
          .toBuffer(),
        top: 12,
        left: 12,
      },
      {
        input: icon,
        top: Math.round(height * 0.38),
        left: Math.round((width - iconSize) / 2),
      },
    ])
    .png()
    .toFile(join(outDir, name));
  console.log("✓", name);
  return frame;
}

async function desktopPreview() {
  const icon = await sharp(src).resize(96, 96).png().toBuffer();
  await sharp({
    create: { width: 1280, height: 800, channels: 3, background: { r: 28, g: 32, b: 40 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 1200, height: 700, channels: 3, background: { r: 236, g: 239, b: 244 } },
        })
          .png()
          .toBuffer(),
        top: 50,
        left: 40,
      },
      { input: icon, top: 320, left: 592 },
    ])
    .png()
    .toFile(join(outDir, "03-desktop-preview.png"));
  console.log("✓ 03-desktop-preview.png");
}

async function pwaPreview() {
  const icon = await sharp(src).resize(80, 80).png().toBuffer();
  await sharp({
    create: { width: 390, height: 720, channels: 3, background: { r: 12, g: 12, b: 14 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 366, height: 640, channels: 3, background: { r: 245, g: 245, b: 247 } },
        })
          .png()
          .toBuffer(),
        top: 40,
        left: 12,
      },
      { input: icon, top: 280, left: 155 },
    ])
    .png()
    .toFile(join(outDir, "04-pwa-preview.png"));
  console.log("✓ 04-pwa-preview.png");
}

await sizeLadder();
await phoneFrame("01-iphone-preview.png", 390, 844, { r: 18, g: 18, b: 20 }, { r: 250, g: 250, b: 252 });
await phoneFrame("02-samsung-preview.png", 400, 860, { r: 10, g: 12, b: 16 }, { r: 248, g: 249, b: 251 });
await desktopPreview();
await pwaPreview();
await splashPreview();
console.log("\nOK — previews in reports/rx-icon-polish-previews/");
