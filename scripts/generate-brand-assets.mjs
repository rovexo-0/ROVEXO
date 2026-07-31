/**
 * Generates official ROVEXO brand assets (Blood XXXVII / XXXVIII · Phase C).
 * Level I Master → OG / splash · Level III App Icon → PWA / Apple · Level IV → favicon
 * Run: node scripts/generate-brand-assets.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const masterPng = join(root, "public", "brand", "canonical-rx", "rx-mark-v3.png");


const appIconPng = join(root, "public", "brand", "canonical-rx", "app-icon-v1.png");
const faviconSrcPng = join(root, "public", "brand", "canonical-rx", "favicon-rx-v1.png");

for (const [label, path] of [
  ["Level I Master", masterPng],
  ["Level III App Icon", appIconPng],
  ["Level IV Favicon", faviconSrcPng],
]) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}:`, path);
    process.exit(1);
  }
}

const master = readFileSync(masterPng);
const appIcon = readFileSync(appIconPng);
const faviconSrc = readFileSync(faviconSrcPng);
const chromeSource = appIcon;
const faviconSource = faviconSrc;

async function png(size, outPath, options = {}) {
  mkdirSync(dirname(outPath), { recursive: true });
  let pipeline = sharp(chromeSource).resize(size, size, {
    fit: "contain",
    background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (options.flatten) {
    pipeline = pipeline.flatten({ background: options.flatten });
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
}

async function maskablePng(size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const iconSize = Math.round(size * 0.72);
  const pad = Math.round((size - iconSize) / 2);
  const icon = await sharp(chromeSource)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 11, g: 18, b: 36, alpha: 1 } },
  })
    .composite([{ input: icon, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function monochromePng(size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(chromeSource)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .greyscale()
    .threshold(140)
    .png()
    .toFile(outPath);
}

async function adaptiveForeground(size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const iconSize = Math.round(size * 0.58);
  const pad = Math.round((size - iconSize) / 2);
  const icon = await sharp(chromeSource)
    .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: icon, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function adaptiveBackground(size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp({
    create: { width: size, height: size, channels: 3, background: { r: 11, g: 18, b: 36 } },
  })
    .png()
    .toFile(outPath);
}

async function ogImage(outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const mark = await sharp(master)
    .resize(420, 420, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: { r: 247, g: 249, b: 252 } },
  })
    .composite([{ input: mark, top: 105, left: 390 }])
    .png()
    .toFile(outPath);
}

async function createIco(sizes) {
  const buffers = [];
  for (const s of sizes) {
    buffers.push(
      await sharp(faviconSource)
        .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    );
  }

  const count = buffers.length;
  let offset = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const parts = [header];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffers[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffers[i].length;
    parts.push(entry);
  }
  parts.push(...buffers);
  return Buffer.concat(parts);
}

async function splash(width, height, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const markSize = Math.min(width, height) * 0.28;
  const mark = await sharp(master)
    .resize(Math.round(markSize), Math.round(markSize), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(outPath);
}

const webIcons = [
  ["public/icons/favicon-16.png", 16],
  ["public/icons/favicon-32.png", 32],
  ["public/icons/favicon-48.png", 48],
  ["public/icons/favicon-64.png", 64],
  ["public/icons/icon-16.png", 16],
  ["public/icons/icon-32.png", 32],
  ["public/icons/icon-48.png", 48],
  ["public/icons/icon-64.png", 64],
  ["public/icons/icon-96.png", 96],
  ["public/icons/icon-128.png", 128],
  ["public/icons/icon-144.png", 144],
  ["public/icons/icon-152.png", 152],
  ["public/icons/icon-167.png", 167],
  ["public/icons/icon-180.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-256.png", 256],
  ["public/icons/icon-384.png", 384],
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-1024.png", 1024],
  ["public/icons/icon-maskable-512.png", 512, "maskable"],
  ["public/icons/icon-120.png", 120],
  ["app/apple-icon.png", 180],
  ["public/apple-icon.png", 180],
  ["app/icon.png", 512],
];

const iosSizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
const androidLauncher = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};
const androidAdaptive = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

const iosContents = {
  images: [
    { size: "20x20", idiom: "iphone", filename: "icon-20.png", scale: "1x" },
    { size: "20x20", idiom: "iphone", filename: "icon-40.png", scale: "2x" },
    { size: "20x20", idiom: "iphone", filename: "icon-60.png", scale: "3x" },
    { size: "29x29", idiom: "iphone", filename: "icon-29.png", scale: "1x" },
    { size: "29x29", idiom: "iphone", filename: "icon-58.png", scale: "2x" },
    { size: "29x29", idiom: "iphone", filename: "icon-87.png", scale: "3x" },
    { size: "40x40", idiom: "iphone", filename: "icon-40.png", scale: "1x" },
    { size: "40x40", idiom: "iphone", filename: "icon-80.png", scale: "2x" },
    { size: "40x40", idiom: "iphone", filename: "icon-120.png", scale: "3x" },
    { size: "60x60", idiom: "iphone", filename: "icon-120.png", scale: "2x" },
    { size: "60x60", idiom: "iphone", filename: "icon-180.png", scale: "3x" },
    { size: "76x76", idiom: "ipad", filename: "icon-76.png", scale: "1x" },
    { size: "76x76", idiom: "ipad", filename: "icon-152.png", scale: "2x" },
    { size: "83.5x83.5", idiom: "ipad", filename: "icon-167.png", scale: "2x" },
    { size: "1024x1024", idiom: "ios-marketing", filename: "icon-1024.png", scale: "1x" },
  ],
  info: { version: 1, author: "xcode" },
};

async function main() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2048" height="2048" viewBox="0 0 2048 2048" role="img" aria-label="ROVEXO RX App Icon">
  <title>ROVEXO Official App Icon</title>
  <image width="2048" height="2048" xlink:href="/brand/canonical-rx/app-icon-v1.png" href="/brand/canonical-rx/app-icon-v1.png"/>
</svg>
`;
  writeFileSync(join(root, "public", "brand", "canonical-rx", "rx-emblem-v1.svg"), svg);
  writeFileSync(join(root, "public", "favicon.svg"), svg);
  await sharp(chromeSource)
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(join(root, "public", "brand", "canonical-rx", "rx-emblem-v1.webp"));
  await sharp(chromeSource)
    .avif({ quality: 55 })
    .toFile(join(root, "public", "brand", "canonical-rx", "rx-emblem-v1.avif"));

  for (const [rel, size, kind] of webIcons) {
    const out = join(root, rel);
    if (kind === "maskable") await maskablePng(size, out);
    else await png(size, out);
    console.log("✓", rel);
  }

  await png(32, join(root, "public", "icons", "favicon.ico.png"));

  const ico = await createIco([16, 32, 48]);
  writeFileSync(join(root, "public", "favicon.ico"), ico);
  writeFileSync(join(root, "app", "favicon.ico"), ico);
  console.log("✓ public/favicon.ico");
  console.log("✓ app/favicon.ico");

  const iosDir = join(root, "mobile", "ios", "AppIcon.appiconset");
  mkdirSync(iosDir, { recursive: true });
  for (const size of iosSizes) {
    await png(size, join(iosDir, `icon-${size}.png`));
    console.log("✓ ios", size);
  }
  writeFileSync(join(iosDir, "Contents.json"), JSON.stringify(iosContents, null, 2));

  for (const [folder, size] of Object.entries(androidLauncher)) {
    const dir = join(root, "mobile", "android", folder);
    await png(size, join(dir, "ic_launcher.png"));
    console.log("✓ android", folder, size);
  }

  for (const [folder, size] of Object.entries(androidAdaptive)) {
    const dir = join(root, "mobile", "android", folder);
    await adaptiveForeground(size, join(dir, "ic_launcher_foreground.png"));
    await adaptiveBackground(size, join(dir, "ic_launcher_background.png"));
    await monochromePng(size, join(dir, "ic_launcher_monochrome.png"));
    console.log("✓ android adaptive", folder);
  }

  await ogImage(join(root, "public", "brand", "og-image.png"));
  console.log("✓ public/brand/og-image.png");

  const splashes = [
    ["mobile/splash/iphone-light.png", 1170, 2532],
    ["mobile/splash/ipad-light.png", 1668, 2388],
    ["mobile/splash/android-phone.png", 1080, 2400],
  ];
  for (const [rel, w, h] of splashes) {
    await splash(w, h, join(root, rel));
    console.log("✓", rel);
  }

  console.log("\nOK — Phase C brand assets (Level III PWA · Level IV favicon · Level I OG/splash)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
