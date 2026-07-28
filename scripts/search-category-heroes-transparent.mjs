/**
 * Blood XXIX — transparent Search heroes with soft ground shadows.
 * 1) Flood-fill white canvas from edges → transparent
 * 2) Grow soft-shadow region only from canvas boundary into light-gray floor
 * 3) Never punch holes in cream/white product interiors
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public/search/categories");
const MASTERS = path.join(DIR, "_masters");

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function chroma(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isWhiteCanvas(r, g, b) {
  return luma(r, g, b) >= 247 && chroma(r, g, b) <= 10;
}

function isNearWhiteCanvas(r, g, b) {
  return luma(r, g, b) >= 240 && chroma(r, g, b) <= 12;
}

/** Soft gray contact shadow under products */
function isSoftGrayShadow(r, g, b) {
  const L = luma(r, g, b);
  return L >= 185 && L < 245 && chroma(r, g, b) <= 12;
}

/** Residual white floor plate (not cream/colored merchandise) */
function isWhiteFloorPlate(r, g, b) {
  return luma(r, g, b) >= 250 && chroma(r, g, b) <= 6;
}

function isSoftFloor(r, g, b) {
  return isSoftGrayShadow(r, g, b) || isWhiteFloorPlate(r, g, b);
}

async function processFile(file) {
  const master = path.join(MASTERS, file);
  const { data, info } = await sharp(master)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const n = width * height;
  const canvas = new Uint8Array(n);
  const shadow = new Uint8Array(n);

  const oAt = (x, y) => (y * width + x) * channels;
  const iAt = (x, y) => y * width + x;

  // —— 1. Canvas flood from edges ——
  const q = new Int32Array(n * 2);
  let qh = 0;
  let qt = 0;
  const seedCanvas = (x, y) => {
    const o = oAt(x, y);
    if (!isWhiteCanvas(data[o], data[o + 1], data[o + 2])) return;
    const i = iAt(x, y);
    if (canvas[i]) return;
    canvas[i] = 1;
    q[qt++] = x;
    q[qt++] = y;
  };
  for (let x = 0; x < width; x++) {
    seedCanvas(x, 0);
    seedCanvas(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seedCanvas(0, y);
    seedCanvas(width - 1, y);
  }
  while (qh < qt) {
    const x = q[qh++];
    const y = q[qh++];
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = iAt(nx, ny);
      if (canvas[ni]) continue;
      const o = oAt(nx, ny);
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      if (isWhiteCanvas(r, g, b) || isNearWhiteCanvas(r, g, b)) {
        canvas[ni] = 1;
        q[qt++] = nx;
        q[qt++] = ny;
      }
    }
  }

  // —— 2b. Remove enclosed white islands (floor plates / handle holes) ——
  // Do not touch light merchandise that forms tall product shapes (e.g. white sneakers).
  const seenIsland = new Uint8Array(n);
  for (let start = 0; start < n; start++) {
    if (canvas[start] || shadow[start] || seenIsland[start]) continue;
    const o0 = start * channels;
    if (!isWhiteFloorPlate(data[o0], data[o0 + 1], data[o0 + 2]) && !isNearWhiteCanvas(data[o0], data[o0 + 1], data[o0 + 2])) {
      continue;
    }
    // BFS component
    let head = 0;
    let tail = 0;
    const comp = [];
    seenIsland[start] = 1;
    q[tail++] = start % width;
    q[tail++] = (start / width) | 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let touchesBorder = false;
    while (head < tail) {
      const x = q[head++];
      const y = q[head++];
      comp.push(iAt(x, y));
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = iAt(nx, ny);
        if (canvas[ni] || shadow[ni] || seenIsland[ni]) continue;
        const o = oAt(nx, ny);
        if (
          !isWhiteFloorPlate(data[o], data[o + 1], data[o + 2]) &&
          !isNearWhiteCanvas(data[o], data[o + 1], data[o + 2])
        ) {
          continue;
        }
        seenIsland[ni] = 1;
        q[tail++] = nx;
        q[tail++] = ny;
      }
    }
    if (touchesBorder) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const area = comp.length;
    const aspect = bw / Math.max(1, bh);
    const cy = (minY + maxY) / 2 / height;
    const isHole = area < 12000;
    const isFloorPlate = cy > 0.38 && aspect >= 1.05 && area > 300;
    if (!isHole && !isFloorPlate) continue;
    for (const i of comp) {
      canvas[i] = 1; // fully remove island → transparent
    }
  }

  // —— 2. Soft shadow grow ONLY from canvas into soft floor (limited depth) ——
  qh = 0;
  qt = 0;
  const depth = new Int16Array(n);
  depth.fill(-1);
  for (let i = 0; i < n; i++) {
    if (!canvas[i]) continue;
    const x = i % width;
    const y = (i / width) | 0;
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = iAt(nx, ny);
      if (canvas[ni] || shadow[ni]) continue;
      const o = oAt(nx, ny);
      if (!isSoftFloor(data[o], data[o + 1], data[o + 2])) continue;
      shadow[ni] = 1;
      depth[ni] = 0;
      q[qt++] = nx;
      q[qt++] = ny;
    }
  }
  const MAX_SHADOW_DEPTH = 96;
  while (qh < qt) {
    const x = q[qh++];
    const y = q[qh++];
    const di = iAt(x, y);
    const d = depth[di];
    if (d >= MAX_SHADOW_DEPTH) continue;
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = iAt(nx, ny);
      if (canvas[ni] || shadow[ni]) continue;
      const o = oAt(nx, ny);
      if (!isSoftFloor(data[o], data[o + 1], data[o + 2])) continue;
      shadow[ni] = 1;
      depth[ni] = d + 1;
      q[qt++] = nx;
      q[qt++] = ny;
    }
  }

  // —— 3. Build RGBA ——
  const out = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const oo = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];

    if (canvas[i]) {
      out[oo] = 0;
      out[oo + 1] = 0;
      out[oo + 2] = 0;
      out[oo + 3] = 0;
      continue;
    }

    if (shadow[i]) {
      const L = luma(r, g, b);
      // Near-white floor plate → mostly transparent soft contact
      if (L >= 244) {
        const falloff = 1 - Math.min(1, depth[i] / MAX_SHADOW_DEPTH);
        out[oo] = 14;
        out[oo + 1] = 14;
        out[oo + 2] = 18;
        out[oo + 3] = Math.round(8 + falloff * 36);
        continue;
      }
      const strength = Math.min(1, Math.max(0.15, (248 - L) / 60));
      const falloff = 1 - Math.min(1, depth[i] / MAX_SHADOW_DEPTH);
      out[oo] = 14;
      out[oo + 1] = 14;
      out[oo + 2] = 18;
      out[oo + 3] = Math.round(22 + strength * falloff * 100);
      continue;
    }

    // Keep product pixels intact (including cream / white sneakers)
    out[oo] = r;
    out[oo + 1] = g;
    out[oo + 2] = b;
    out[oo + 3] = 255;
  }

  // Soften shadow alpha only (3×3)
  const aBlur = Buffer.alloc(n);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = iAt(x, y);
      if (!shadow[i]) {
        aBlur[i] = out[i * 4 + 3];
        continue;
      }
      let sum = 0;
      let wsum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          const w = 3 - Math.max(Math.abs(dx), Math.abs(dy));
          sum += out[iAt(xx, yy) * 4 + 3] * w;
          wsum += w;
        }
      }
      aBlur[i] = Math.round(sum / wsum);
    }
  }
  for (let i = 0; i < n; i++) {
    if (shadow[i]) out[i * 4 + 3] = aBlur[i];
  }

  // 1px dark AA on canvas adjacent to opaque product (no white halo)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = iAt(x, y);
      if (!canvas[i]) continue;
      let touch = false;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        const ni = iAt(nx, ny);
        if (!canvas[ni] && !shadow[ni] && out[ni * 4 + 3] === 255) touch = true;
      }
      if (touch) {
        const oo = i * 4;
        out[oo] = 20;
        out[oo + 1] = 20;
        out[oo + 2] = 24;
        out[oo + 3] = 40;
      }
    }
  }

  const dest = path.join(DIR, file);
  await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(dest);
  await sharp(dest).webp({ quality: 95, alphaQuality: 100 }).toFile(dest.replace(/\.png$/, ".webp"));
  console.log("ok", file);
}

const files = fs.readdirSync(MASTERS).filter((f) => f.endsWith(".png"));
for (const file of files) {
  await processFile(file);
}
console.log("done", files.length);
