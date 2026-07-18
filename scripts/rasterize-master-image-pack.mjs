/**
 * Convert Master Image Pack SVGs → PNGs via sharp (no Chromium).
 * Also writes responsive composites for PO visual certification.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT = join(process.cwd(), "owner-review-screenshots", "master-image-pack-v1");
const FRAMES = join(OUT, "frames");
const PNG_DIR = join(OUT, "png");
const RESPONSIVE = join(OUT, "responsive");

const VIEWPORTS = [
  { id: "iphone", width: 430, label: "iPhone" },
  { id: "samsung", width: 412, label: "Samsung Ultra" },
  { id: "tablet", width: 768, label: "Tablet" },
  { id: "desktop", width: 1280, label: "Desktop" },
];

async function convertSvgToPng(svgPath, pngPath, width = 390) {
  const svg = readFileSync(svgPath);
  await sharp(svg, { density: 192 })
    .resize({ width, fit: "inside", withoutEnlargement: false })
    .png()
    .toFile(pngPath);
}

async function main() {
  if (!existsSync(FRAMES)) {
    console.error("Missing frames/ — run generate-master-image-pack-local.mjs first");
    process.exit(1);
  }

  mkdirSync(PNG_DIR, { recursive: true });
  mkdirSync(RESPONSIVE, { recursive: true });

  const svgs = readdirSync(FRAMES).filter((f) => f.endsWith(".svg")).sort();
  console.log(`Converting ${svgs.length} SVG → PNG…`);

  let i = 0;
  for (const name of svgs) {
    const base = name.replace(/\.svg$/, "");
    await convertSvgToPng(join(FRAMES, name), join(PNG_DIR, `${base}.png`), 390);
    i += 1;
    if (i % 40 === 0 || i === svgs.length) console.log(`  ${i}/${svgs.length}`);
  }

  // Responsive: render hub default frames at each viewport width
  const defaults = svgs.filter((f) => f.includes("-default.svg"));
  for (const vp of VIEWPORTS) {
    const dir = join(RESPONSIVE, vp.id);
    mkdirSync(dir, { recursive: true });
    for (const name of defaults) {
      const base = name.replace(/\.svg$/, "");
      await convertSvgToPng(join(FRAMES, name), join(dir, `${base}.png`), vp.width);
    }
  }

  writeFileSync(
    join(OUT, "PNG_README.md"),
    `# Master Image Pack — PNG + Responsive

Generated with sharp (no Chromium).

- \`png/\` — ${svgs.length} phone frames (390px)
- \`responsive/iphone|samsung|tablet|desktop/\` — default states at device widths
- \`frames/\` — SVG source of truth
- \`index.html\` — browse all frames

Use for Product Owner visual review and Master Preview certification.
`,
    "utf8",
  );

  // Update index to link PNGs too
  const indexPath = join(OUT, "index.html");
  if (existsSync(indexPath)) {
    let html = readFileSync(indexPath, "utf8");
    if (!html.includes("png/")) {
      html = html.replace(
        "</header>",
        `<p>Also: <a href="png/">PNG frames</a> · <a href="responsive/">Responsive</a> · <a href="PNG_README.md">PNG README</a></p></header>`,
      );
      writeFileSync(indexPath, html, "utf8");
    }
  }

  console.log(`PNG written: ${PNG_DIR}`);
  console.log(`Responsive: ${RESPONSIVE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
