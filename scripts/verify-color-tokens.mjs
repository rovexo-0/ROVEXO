#!/usr/bin/env node
/**
 * Scans active codebase for legacy blue accents and hardcoded primary colors.
 * Output: reports/module-2/final-visual/COLOR_TOKEN_VERIFICATION.md
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "reports", "module-2", "final-visual", "COLOR_TOKEN_VERIFICATION.md");
const UI_ROOTS = ["app", "components", "features", "styles", "lib"];
const SKIP_DIRS = new Set(["node_modules", ".next", "archive", ".git", "ROVEXO", "ROVEXO_UPLOAD", "recovered-homepage", "scripts"]);

const PATTERNS = [
  { id: "hex-2563eb", re: /#2563eb/gi, label: "Legacy blue hex #2563eb" },
  { id: "hex-3b82f6", re: /#3b82f6/gi, label: "Legacy blue hex #3b82f6" },
  { id: "hex-1d4ed8", re: /#1d4ed8/gi, label: "Legacy blue hex #1d4ed8" },
  { id: "rgb-blue", re: /rgba?\(\s*37\s*,\s*99\s*,\s*235/gi, label: "Hardcoded rgb blue (37,99,235)" },
  { id: "tailwind-blue", re: /\b(?:text|bg|border|ring|from|to|via)-blue-\d+/g, label: "Tailwind blue-* utility" },
];

const EXT = new Set([".css", ".tsx", ".ts", ".jsx", ".js", ".mjs"]);

function walk(dir, files = []) {
  const baseName = dir.replace(ROOT + "\\", "").replace(ROOT + "/", "").split(/[/\\]/)[0];
  if (!UI_ROOTS.includes(baseName) && dir !== ROOT) return files;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(name.slice(name.lastIndexOf(".")))) files.push(full);
  }
  return files;
}

/** @type {Map<string, Array<{pattern:string,line:number,snippet:string}>>} */
const hits = new Map();
const files = [];

for (const root of UI_ROOTS) {
  const start = join(ROOT, root);
  if (statSync(start).isDirectory()) walk(start, files);
}

for (const file of files) {
  const rel = file.replace(ROOT + "\\", "").replace(ROOT + "/", "");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/blue-green/i.test(line)) continue;
    for (const pat of PATTERNS) {
      if (pat.re.test(line)) {
        pat.re.lastIndex = 0;
        if (!hits.has(rel)) hits.set(rel, []);
        hits.get(rel).push({
          pattern: pat.id,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
        });
      }
      pat.re.lastIndex = 0;
    }
  }
}

const totalHits = [...hits.values()].reduce((n, arr) => n + arr.length, 0);
const status = totalHits === 0 ? "PASS" : "FAIL";

mkdirSync(join(ROOT, "reports", "module-2", "final-visual"), { recursive: true });

let md = `# Color Token Verification Report

**Generated:** ${new Date().toISOString()}  
**Status:** **${status}**  
**Legacy blue hits:** ${totalHits} across ${hits.size} files

Official ROVEXO accent: \`--ds-color-primary: #9333ea\` (light) / \`#a855f7\` (dark)

---

`;

if (totalHits === 0) {
  md += `_No legacy blue accents found in active codebase (archive and nested copies excluded)._\n`;
} else {
  md += `## Findings\n\n`;
  for (const [file, items] of [...hits.entries()].sort()) {
    md += `### \`${file}\`\n\n`;
    for (const item of items) {
      md += `- L${item.line} [\`${item.pattern}\`] ${item.snippet.replace(/\|/g, "\\|")}\n`;
    }
    md += "\n";
  }
}

md += `---
**End of color token verification.**
`;

writeFileSync(OUT, md);
console.log(`Wrote ${OUT} — ${status} (${totalHits} hits)`);
process.exit(totalHits > 0 ? 1 : 0);
