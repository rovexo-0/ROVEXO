import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FILES = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statIsDir(full)) {
      if (["node_modules", ".next"].includes(name)) continue;
      walk(full);
    } else if (/\.(tsx|ts)$/.test(name)) FILES.push(full);
  }
}

function statIsDir(full) {
  return fs.statSync(full).isDirectory();
}

for (const d of ["features", "app", "tests"]) walk(path.join(ROOT, d));

function migrate(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const orig = src;
  if (
    !src.includes("SettingsPageShell") &&
    !src.includes("AccountModuleShell") &&
    !src.includes("AccountPageShell")
  ) {
    return false;
  }

  src = src.replace(
    /import\s*\{\s*SettingsPageShell\s*\}\s*from\s*"@\/features\/account-module\/components\/SettingsPageShell";/g,
    'import { AccountCanonicalShell } from "@/features/account-canonical";',
  );
  src = src.replace(
    /import\s*\{\s*AccountModuleShell\s*\}\s*from\s*"@\/features\/account-module\/components\/AccountModuleShell";/g,
    'import { AccountCanonicalShell } from "@/features/account-canonical";',
  );
  src = src.replace(
    /import\s*\{\s*AccountPageShell\s*\}\s*from\s*"@\/features\/account\/components\/AccountPageShell";/g,
    'import { AccountCanonicalShell } from "@/features/account-canonical";',
  );

  // Combined imports
  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*"@\/features\/account-module\/components\/SettingsPageShell";/g,
    (m, inner) => {
      const names = inner.split(",").map((s) => s.trim());
      const mapped = names.map((n) => n.replace("SettingsPageShell", "AccountCanonicalShell"));
      return `import { ${mapped.join(", ")} } from "@/features/account-canonical";`;
    },
  );

  src = src.replace(/\bSettingsPageShell\b/g, "AccountCanonicalShell");
  src = src.replace(/\bAccountModuleShell\b/g, "AccountCanonicalShell");
  src = src.replace(/\bAccountPageShell\b/g, "AccountCanonicalShell");
  src = src.replace(/\bsubtitle=/g, "intro=");

  if (src !== orig) {
    fs.writeFileSync(filePath, src);
    console.log(path.relative(ROOT, filePath));
    return true;
  }
  return false;
}

let n = 0;
for (const f of FILES) if (migrate(f)) n++;
console.log(`Shell migration: ${n} files`);
