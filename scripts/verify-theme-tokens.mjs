#!/usr/bin/env node
/**
 * Verifies theme token definitions and documents Theme Engine contract.
 * Output: reports/module-2/final-visual/THEME_VERIFICATION.md
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "reports", "module-2", "final-visual", "THEME_VERIFICATION.md");
const tokensPath = join(ROOT, "styles", "tokens.css");

mkdirSync(join(ROOT, "reports", "module-2", "final-visual"), { recursive: true });

const tokens = existsSync(tokensPath) ? readFileSync(tokensPath, "utf8") : "";

function extractBlock(selector) {
  const idx = tokens.indexOf(selector);
  if (idx === -1) return "";
  const start = tokens.indexOf("{", idx);
  const end = tokens.indexOf("}", start);
  return tokens.slice(start + 1, end);
}

const rootBlock = extractBlock(":root");
const lightBlock = extractBlock('[data-theme="light"]');
const darkBlock = extractBlock('[data-theme="dark"]');

function getPrimary(block) {
  const m = block.match(/--ds-color-primary:\s*([^;]+)/);
  return m ? m[1].trim() : "missing";
}

const rootPrimary = getPrimary(rootBlock);
const lightPrimary = getPrimary(lightBlock);
const darkPrimary = getPrimary(darkBlock);

const checks = [
  {
    id: "tokens-file",
    pass: existsSync(tokensPath),
    detail: existsSync(tokensPath) ? "styles/tokens.css present" : "Missing tokens.css",
  },
  {
    id: "root-purple",
    pass: rootPrimary.includes("9333ea"),
    detail: `:root --ds-color-primary = ${rootPrimary}`,
  },
  {
    id: "light-purple",
    pass: lightPrimary.includes("9333ea"),
    detail: `[data-theme=light] --ds-color-primary = ${lightPrimary}`,
  },
  {
    id: "dark-purple",
    pass: darkPrimary.includes("a855f7"),
    detail: `[data-theme=dark] --ds-color-primary = ${darkPrimary}`,
  },
  {
    id: "no-blue-light",
    pass: !lightBlock.includes("2563eb") && !lightBlock.includes("37, 99, 235"),
    detail: "Light theme block has no legacy blue",
  },
  {
    id: "appearance-picker",
    pass: existsSync(join(ROOT, "features", "settings", "components", "AppearancePicker.tsx")),
    detail: "AppearancePicker component exists (white/black themes)",
  },
];

const pass = checks.filter((c) => c.pass).length;
const status = pass === checks.length ? "PASS" : "FAIL";

let md = `# Theme Verification Report

**Generated:** ${new Date().toISOString()}  
**Status:** **${status}** (${pass}/${checks.length} checks)

## Theme Engine Contract

- **Modes:** White (\`light\`) and Black (\`dark\`) only — no system/auto toggle in UI.
- **Accent:** Official ROVEXO Purple via \`--ds-color-primary\` on both themes.
- **Inheritance:** Components should use design tokens (\`var(--ds-color-*)\`, Tailwind \`primary\`, \`text-text-primary\`) — not hardcoded hex/rgb blues.

## Token Checks

| Check | Status | Detail |
|-------|--------|--------|
`;

for (const c of checks) {
  md += `| ${c.id} | **${c.pass ? "PASS" : "FAIL"}** | ${c.detail} |\n`;
}

md += `
---

## Primary Token Values

| Scope | \`--ds-color-primary\` |
|-------|------------------------|
| \`:root\` | \`${rootPrimary}\` |
| \`[data-theme=light]\` | \`${lightPrimary}\` |
| \`[data-theme=dark]\` | \`${darkPrimary}\` |

**End of theme verification.**
`;

writeFileSync(OUT, md);
console.log(`Wrote ${OUT} — ${status}`);
process.exit(status === "PASS" ? 0 : 1);
