import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FILES = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (["node_modules", ".next"].includes(name)) continue;
      walk(full);
    } else if (/\.(tsx|ts)$/.test(name)) FILES.push(full);
  }
}
walk(path.join(ROOT, "features"));
walk(path.join(ROOT, "app"));
walk(path.join(ROOT, "tests"));

function dedupeImports(src) {
  const importRe = /^import\s*\{([^}]+)\}\s*from\s*"@\/src\/components\/canonical";$/gm;
  const names = new Set();
  let changed = false;
  const without = src.replace(importRe, (match, inner) => {
    changed = true;
    for (const part of inner.split(",")) {
      const n = part.trim();
      if (n) names.add(n);
    }
    return "";
  });
  if (!changed || names.size === 0) return src;
  const cleaned = without.replace(/\n{3,}/g, "\n\n");
  const firstImport = cleaned.search(/^import /m);
  const insert =
    `import { ${[...names].join(", ")} } from "@/src/components/canonical";\n`;
  if (firstImport === -1) return insert + cleaned;
  return cleaned.slice(0, firstImport) + insert + cleaned.slice(firstImport);
}

let n = 0;
for (const f of FILES) {
  const src = fs.readFileSync(f, "utf8");
  const next = dedupeImports(src);
  if (next !== src) {
    fs.writeFileSync(f, next);
    n++;
    console.log(path.relative(ROOT, f));
  }
}
console.log(`Deduped ${n} files`);
