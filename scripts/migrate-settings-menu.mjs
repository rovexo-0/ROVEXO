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

function ensureImport(src, importLine) {
  if (src.includes(importLine)) return src;
  const lastImport = [...src.matchAll(/^import .+$/gm)].pop();
  if (lastImport) {
    const idx = lastImport.index + lastImport[0].length;
    return src.slice(0, idx) + "\n" + importLine + src.slice(idx);
  }
  return importLine + "\n" + src;
}

function migrate(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  if (!src.includes("SettingsMenu") && !src.includes("SettingsPageBody")) return false;
  const orig = src;

  src = src.replace(
    /import\s*\{([^}]+)\}\s*from\s*"@\/features\/account-module\/components\/SettingsMenu";/g,
    (match, inner) => {
      const names = inner.split(",").map((s) => s.trim()).filter(Boolean);
      const canonical = new Set([
        "CanonicalButton",
        "CanonicalInfoBlock",
        "CanonicalInput",
        "CanonicalSelector",
        "CanonicalSwitch",
        "CanonicalTextarea",
      ]);
      const cds = new Set(["CanonicalSection", "CanonicalCard", "CanonicalMenuRow"]);
      let needStack = false;
      let needCn = false;

      for (const n of names) {
        const base = n.split(" as ")[0].trim();
        if (base === "SettingsPageBody") needStack = true;
        if (base === "SettingsMenuSection") cds.add("CanonicalSection");
        if (base === "SettingsMenuCard") cds.add("CanonicalCard");
        if (base === "SettingsMenuRow") cds.add("CanonicalMenuRow");
        if (base === "SettingsFormPanel") {
          cds.add("CanonicalCard");
          needCn = true;
        }
        if (base === "SettingsEmptyState") cds.add("CanonicalInfoBlock");
        if (canonical.has(base)) canonical.delete(base);
        if (["SettingsPageBody", "SettingsMenuSection", "SettingsMenuCard", "SettingsMenuRow", "SettingsFormPanel", "SettingsEmptyState"].includes(base)) continue;
        canonical.add(base);
      }

      const lines = [];
      if (cds.size) lines.push(`import { ${[...cds].join(", ")} } from "@/src/components/canonical";`);
      if (canonical.size) lines.push(`import { ${[...canonical].join(", ")} } from "@/src/components/canonical";`);
      if (needStack) lines.push('import { AccountPageStack } from "@/features/account-canonical";');
      if (needCn && !src.includes('from "@/lib/cn"')) {
        // cn added separately below
      }
      return lines.join("\n");
    },
  );

  src = src.replace(/\bSettingsPageBody\b/g, "AccountPageStack");
  src = src.replace(/\bSettingsMenuSection\b/g, "CanonicalSection");
  src = src.replace(/\bSettingsMenuCard\b/g, "CanonicalCard");
  src = src.replace(/\bSettingsMenuRow\b/g, "CanonicalMenuRow");
  src = src.replace(/\bSettingsEmptyState\b/g, 'CanonicalInfoBlock variant="description"');
  // SettingsFormPanel -> helper pattern
  src = src.replace(/<SettingsFormPanel/g, '<CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4"');
  src = src.replace(/<\/SettingsFormPanel>/g, "</CanonicalCard>");

  src = src.replace(/<CanonicalMenuRow([^>/]*)\slabel=/g, "<CanonicalMenuRow$1 title=");
  src = src.replace(/<CanonicalCard(?![^>]*variant=)([^>]*>)/g, '<CanonicalCard variant="list"$1');

  if (src.includes('CanonicalInfoBlock variant="description"')) {
    src = ensureImport(src, 'import { CanonicalInfoBlock } from "@/src/components/canonical";');
  }

  if (src !== orig) {
    fs.writeFileSync(filePath, src);
    console.log(path.relative(ROOT, filePath));
    return true;
  }
  return false;
}

let n = 0;
for (const f of FILES) if (migrate(f)) n++;
console.log(`Menu migration: ${n} files`);
