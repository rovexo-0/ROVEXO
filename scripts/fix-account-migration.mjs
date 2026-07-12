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

function fix(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const orig = src;

  src = src.replace(/<\/CanonicalInfoBlock variant="description">/g, "</CanonicalInfoBlock>");
  src = src.replace(/\s+version="[^"]*"/g, (m, offset) => {
    const before = src.slice(Math.max(0, offset - 80), offset);
    if (before.includes("AccountCanonicalShell") || before.includes("AccountPageStack")) return "";
    return m;
  });

  // Fix broken import blocks in ProfileEditPage style
  src = src.replace(
    /import \{\nimport \{ CanonicalInfoBlock \} from "@\/src\/components\/canonical";\n([^}]+)\} from "@\/src\/components\/canonical";/g,
    'import {\n$1} from "@/src/components/canonical";',
  );

  // Remove duplicate canonical imports (merge consecutive)
  const lines = src.split("\n");
  const out = [];
  const seenCanonical = new Set();
  for (const line of lines) {
    if (line.includes('from "@/src/components/canonical"')) {
      const m = line.match(/import \{([^}]+)\}/);
      if (m) {
        const names = m[1].split(",").map((s) => s.trim());
        const newNames = names.filter((n) => {
          const key = n.split(" as ")[0].trim();
          if (seenCanonical.has(key)) return false;
          seenCanonical.add(key);
          return true;
        });
        if (newNames.length) out.push(`import { ${newNames.join(", ")} } from "@/src/components/canonical";`);
        continue;
      }
    }
    out.push(line);
  }
  src = out.join("\n");

  if (src !== orig) {
    fs.writeFileSync(filePath, src);
    console.log(path.relative(ROOT, filePath));
    return true;
  }
  return false;
}

let n = 0;
for (const f of FILES) if (fix(f)) n++;
console.log(`Fixed ${n} files`);
