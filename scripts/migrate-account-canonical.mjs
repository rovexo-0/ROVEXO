/**
 * Bulk migration: legacy account shells → AccountCanonicalShell + CDS primitives.
 * Run once: node scripts/migrate-account-canonical.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const FILES = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full);
    } else if (/\.(tsx|ts)$/.test(name)) {
      FILES.push(full);
    }
  }
}
walk(path.join(ROOT, "features"));
walk(path.join(ROOT, "app"));
walk(path.join(ROOT, "tests"));

const REPLACEMENTS = [
  [
    /from "@\/features\/account-module\/components\/SettingsPageShell"/g,
    'from "@/features/account-canonical"',
  ],
  [
    /from "@\/features\/account-module\/components\/AccountModuleShell"/g,
    'from "@/features/account-canonical"',
  ],
  [
    /from "@\/features\/account\/components\/AccountPageShell"/g,
    'from "@/features/account-canonical"',
  ],
  [/\bSettingsPageShell\b/g, "AccountCanonicalShell"],
  [/\bAccountModuleShell\b/g, "AccountCanonicalShell"],
  [/\bAccountPageShell\b/g, "AccountCanonicalShell"],
  [
    /from "@\/features\/account-module\/components\/SettingsMenu"/g,
    'from "@/src/components/canonical"',
  ],
  [
    /import\s*\{([^}]+)\}\s*from "@\/src\/components\/canonical";/g,
    (match, imports) => {
      const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
      const map = {
        SettingsPageBody: "AccountPageStack",
        SettingsMenuSection: "CanonicalSection",
        SettingsMenuCard: "CanonicalCard",
        SettingsMenuRow: "CanonicalMenuRow",
        SettingsFormPanel: null,
        SettingsEmptyState: null,
      };
      const extra = [];
      const out = [];
      for (const p of parts) {
        const alias = p.includes(" as ") ? p : p;
        const name = alias.split(" as ")[0].trim();
        if (map[name] === "AccountPageStack") {
          extra.push('import { AccountPageStack } from "@/features/account-canonical";');
        } else if (map[name]) {
          out.push(map[name]);
        } else if (name === "SettingsFormPanel") {
          extra.push(
            'import { CanonicalCard } from "@/src/components/canonical";',
          );
        } else if (name === "SettingsEmptyState") {
          if (!out.includes("CanonicalInfoBlock")) out.push("CanonicalInfoBlock");
        } else {
          out.push(p);
        }
      }
      const uniq = [...new Set(out)];
      const main = uniq.length ? `import { ${uniq.join(", ")} } from "@/src/components/canonical";` : "";
      return [main, ...extra].filter(Boolean).join("\n");
    },
  ],
];

// Simpler line-by-line for SettingsMenu - handle separately
const SIMPLE_IMPORT_FIX = {
  SettingsPageBody: 'AccountPageStack',
};

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, "utf8");
  const orig = src;

  if (!src.includes("SettingsPageShell") && !src.includes("AccountModuleShell") && !src.includes("AccountPageShell") && !src.includes("SettingsMenu")) {
    return false;
  }

  src = src.replace(
    /from "@\/features\/account-module\/components\/SettingsPageShell"/g,
    'from "@/features/account-canonical"',
  );
  src = src.replace(
    /from "@\/features\/account-module\/components\/AccountModuleShell"/g,
    'from "@/features/account-canonical"',
  );
  src = src.replace(
    /from "@\/features\/account\/components\/AccountPageShell"/g,
    'from "@/features/account-canonical"',
  );
  src = src.replace(/\bSettingsPageShell\b/g, "AccountCanonicalShell");
  src = src.replace(/\bAccountModuleShell\b/g, "AccountCanonicalShell");
  src = src.replace(/\bAccountPageShell\b/g, "AccountCanonicalShell");

  if (src.includes("SettingsMenu") || src.includes("SettingsPageBody") || src.includes("SettingsMenuRow")) {
    // Add AccountPageStack import if needed
    if (src.includes("SettingsPageBody") && !src.includes("AccountPageStack")) {
      src = src.replace(
        /from "@\/features\/account-module\/components\/SettingsMenu";/,
        'from "@/src/components/canonical";\nimport { AccountPageStack } from "@/features/account-canonical";',
      );
    } else {
      src = src.replace(
        /from "@\/features\/account-module\/components\/SettingsMenu";/g,
        'from "@/src/components/canonical";\nimport { AccountPageStack } from "@/features/account-canonical";',
      );
    }

    src = src.replace(/\bSettingsPageBody\b/g, "AccountPageStack");
    src = src.replace(/\bSettingsMenuSection\b/g, "CanonicalSection");
    src = src.replace(/\bSettingsMenuCard\b/g, "CanonicalCard");
    src = src.replace(/\bSettingsMenuRow\b/g, "CanonicalMenuRow");
    src = src.replace(/\bSettingsEmptyState\b/g, "CanonicalInfoBlock");
    src = src.replace(/\bSettingsFormPanel\b/g, "CanonicalCard");

    // label= -> title= on CanonicalMenuRow
    src = src.replace(/<CanonicalMenuRow([^>]*)\slabel=/g, "<CanonicalMenuRow$1 title=");

    // CanonicalCard needs variant for list cards
    src = src.replace(/<CanonicalCard>/g, '<CanonicalCard variant="list">');
    src = src.replace(/<CanonicalCard variant="list" variant="list">/g, '<CanonicalCard variant="list">');

    // Form panels used variant medium
    src = src.replace(
      /<CanonicalCard id=([^>]+) variant="list"/g,
      '<CanonicalCard id=$1 variant="medium"',
    );
  }

  // AccountPageShell subtitle prop -> intro on AccountCanonicalShell
  src = src.replace(/\bsubtitle=\{/g, "intro={");

  if (src !== orig) {
    fs.writeFileSync(filePath, src);
    console.log("migrated", path.relative(ROOT, filePath));
    return true;
  }
  return false;
}

let count = 0;
for (const f of FILES) migrateFile(f) && count++;
console.log(`Done: ${count} files`);
