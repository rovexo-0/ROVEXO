import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DIR = join(process.cwd(), "public", "icons", "categories");
const files = readdirSync(DIR).filter((f) => f.endsWith(".svg")).sort();

const CELL = 128; // enlarged for inspection
const PAD = 16;
const COLS = 5;
const rows = Math.ceil(files.length / COLS);
const W = COLS * (CELL + PAD) + PAD;
const H = rows * (CELL + PAD) + PAD;

const composites = [];
for (let i = 0; i < files.length; i += 1) {
  const svg = readFileSync(join(DIR, files[i]));
  const png = await sharp(svg, { density: 384 })
    .resize(CELL, CELL, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  composites.push({
    input: png,
    left: PAD + col * (CELL + PAD),
    top: PAD + row * (CELL + PAD),
  });
}

const out = join(process.cwd(), "category-icons-preview.png");
await sharp({
  create: { width: W, height: H, channels: 4, background: { r: 248, g: 250, b: 252, alpha: 1 } },
})
  .composite(composites)
  .png()
  .toFile(out);

console.log(`Rendered ${files.length} icons -> ${out}`);
console.log(files.join(", "));
