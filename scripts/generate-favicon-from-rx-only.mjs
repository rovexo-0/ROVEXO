/**
 * Generate ALL browser/PWA/Apple icons from Owner-approved RX-only logo (NO HANDS).
 * Source: Owner plate → crop RX monogram → transparent → square matrix.
 * Run: node scripts/generate-favicon-from-rx-only.mjs [path-to-owner-png]
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOwner = join(
  process.env.HOME || "",
  ".cursor/projects/home-mihai-ROVEXO/assets/c__Users_gaming_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_E57616CD-2816-4FF4-80CB-1FD2F98DDC78-3bd7530c-44b5-4366-90b1-0b7a8086c084.png",
);

const ownerPath = process.argv[2] || defaultOwner;

if (!existsSync(ownerPath)) {
  console.error("Missing Owner RX logo:", ownerPath);
  process.exit(1);
}

async function extractTransparentRx(ownerFile) {
  const { data, info } = await sharp(ownerFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const rowDensity = new Array(h).fill(0);

  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!(r > 245 && g > 245 && b > 245)) n++;
    }
    rowDensity[y] = n / w;
  }

  let first = -1;
  let last = -1;
  for (let y = 0; y < h; y++) {
    if (rowDensity[y] > 0.02) {
      if (first < 0) first = y;
      last = y;
    }
  }

  // Owner plate = RX monogram + BUY•SELL•GROW. Soft shadows connect them, so
  // there is no clean density gap — keep the top ~84% of content (RX only).
  let rxTop = Math.max(0, first - 4);
  let rxBottom = first + Math.floor((last - first) * 0.84);
  rxBottom = Math.min(h - 1, Math.max(rxTop + 10, rxBottom));
  let minX = w;
  let maxX = 0;
  for (let y = rxTop; y <= rxBottom; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!(r > 245 && g > 245 && b > 245)) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  const pad = 8;
  minX = Math.max(0, minX - pad);
  maxX = Math.min(w - 1, maxX + pad);

  const crop = {
    left: minX,
    top: rxTop,
    width: maxX - minX + 1,
    height: rxBottom - rxTop + 1,
  };
  console.log("RX crop (no hands, no tagline):", crop);

  const rxPng = await sharp(ownerFile)
    .extract(crop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(rxPng.data.length);
  for (let i = 0; i < rxPng.data.length; i += 4) {
    const r = rxPng.data[i];
    const g = rxPng.data[i + 1];
    const b = rxPng.data[i + 2];
    const white = r > 245 && g > 245 && b > 245;
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = white ? 0 : 255;
  }

  return sharp(out, {
    raw: {
      width: rxPng.info.width,
      height: rxPng.info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

async function squareFromBuf(buf, size, coverRatio = 0.9) {
  const trimmed = await sharp(buf).trim({ threshold: 8 }).png().toBuffer();
  const iconSize = Math.round(size * coverRatio);
  const icon = await sharp(trimmed)
    .resize(iconSize, iconSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeIcon(buf, size, outPath, cover = 0.9) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, await squareFromBuf(buf, size, cover));
  console.log("✓", outPath.replace(root + "/", ""));
}

async function createIco(buf, sizes) {
  const buffers = [];
  for (const s of sizes) buffers.push(await squareFromBuf(buf, s, 0.92));
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

async function main() {
  console.log("Owner source:", ownerPath);
  const transparentRx = await extractTransparentRx(ownerPath);

  const brandDir = join(root, "public/brand/canonical-rx");
  mkdirSync(brandDir, { recursive: true });

  const square2048 = await squareFromBuf(transparentRx, 2048, 0.9);
  writeFileSync(join(brandDir, "rx-favicon-source-v1.png"), square2048);
  writeFileSync(join(brandDir, "favicon-rx-v1.png"), square2048);
  writeFileSync(join(brandDir, "app-icon-v1.png"), square2048);
  writeFileSync(join(brandDir, "app-icon-header-v1.png"), square2048);
  await sharp(ownerPath).png().toFile(join(brandDir, "rx-official-plate-owner-v1.png"));
  await sharp(square2048)
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(join(brandDir, "app-icon-v1.webp"));
  await sharp(square2048)
    .avif({ quality: 55 })
    .toFile(join(brandDir, "app-icon-v1.avif"));
  await sharp(square2048)
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(join(brandDir, "favicon-rx-v1.webp"));
  await sharp(square2048)
    .avif({ quality: 55 })
    .toFile(join(brandDir, "favicon-rx-v1.avif"));
  console.log("✓ brand Level III/IV RX-only sources updated");

  const iconSizes = [16, 32, 48, 64, 128, 192, 256, 512];
  for (const s of iconSizes) {
    await writeIcon(transparentRx, s, join(root, `public/icons/icon-${s}.png`));
    if (s <= 64) {
      await writeIcon(
        transparentRx,
        s,
        join(root, `public/icons/favicon-${s}.png`),
        0.92,
      );
    }
  }

  // Keep other PWA sizes in matrix consistent (same source)
  for (const s of [96, 120, 144, 152, 167, 180, 384, 1024]) {
    await writeIcon(transparentRx, s, join(root, `public/icons/icon-${s}.png`));
  }

  await writeIcon(transparentRx, 180, join(root, "public/apple-touch-icon.png"));
  await writeIcon(transparentRx, 180, join(root, "public/apple-icon.png"));
  await writeIcon(transparentRx, 180, join(root, "app/apple-icon.png"));
  await writeIcon(transparentRx, 512, join(root, "app/icon.png"));

  {
    const size = 512;
    const iconSize = Math.round(size * 0.72);
    const icon = await squareFromBuf(transparentRx, iconSize, 1);
    const pad = Math.round((size - iconSize) / 2);
    const maskable = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 11, g: 18, b: 36, alpha: 1 },
      },
    })
      .composite([{ input: icon, top: pad, left: pad }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeFileSync(join(root, "public/icons/maskable-icon-512.png"), maskable);
    writeFileSync(join(root, "public/icons/icon-maskable-512.png"), maskable);
    console.log("✓ public/icons/maskable-icon-512.png");
    console.log("✓ public/icons/icon-maskable-512.png");
  }

  const ico = await createIco(transparentRx, [16, 32, 48]);
  writeFileSync(join(root, "public/favicon.ico"), ico);
  writeFileSync(join(root, "app/favicon.ico"), ico);
  console.log("✓ public/favicon.ico");
  console.log("✓ app/favicon.ico");

  const fav64 = await squareFromBuf(transparentRx, 64, 0.92);
  writeFileSync(
    join(root, "public/favicon.svg"),
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="ROVEXO">
  <title>ROVEXO</title>
  <image width="64" height="64" href="data:image/png;base64,${fav64.toString("base64")}"/>
</svg>
`,
  );
  console.log("✓ public/favicon.svg");

  console.log("\nOK — All favicon/PWA/Apple icons from Owner RX-only logo (no hands).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
