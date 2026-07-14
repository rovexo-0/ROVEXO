#!/usr/bin/env node
/**
 * Verifies canonical light-only theme tokens (dark theme removed).
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
const hasDarkSelector = /\[data-theme=["']dark["']\]/.test(tokens);

function getPrimary(block) {
  const m = block.match(/--ds-color-primary:\s*([^;]+)/);
  return m ? m[1].trim() : "missing";
}

const rootPrimary = getPrimary(rootBlock);
const lightPrimary = getPrimary(lightBlock);

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
    id: "no-dark-theme-block",
    pass: !hasDarkSelector,
    detail: hasDarkSelector
      ? "Dark theme selector still present in tokens.css"
      : "No [data-theme=dark] block (light-only)",
  },
  {
    id: "no-appearance-picker",
    pass: !existsSync(join(ROOT, "features", "settings", "components", "AppearancePicker.tsx")),
    detail: "AppearancePicker removed (light theme only)",
  },
  {
    id: "no-theme-provider",
    pass: !existsSync(join(ROOT, "components", "providers", "ThemeProvider.tsx")),
    detail: "ThemeProvider removed (light theme only)",
  },
];

const pass = checks.filter((c) => c.pass).length;
const status = pass === checks.length ? "PASS" : "FAIL";

let md = `# Theme Verification Report

**Generated:** ${new Date().toISOString()}  
**Status:** **${status}** (${pass}/${checks.length} checks)

## Theme Contract

- **Mode:** Light only (canonical ROVEXO v1.0).
- **Accent:** Official ROVEXO Purple via \`--ds-color-primary\`.
- **Dark / System themes:** Removed.

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

**End of theme verification.**
`;

writeFileSync(OUT, md);
console.log(`Wrote ${OUT} — ${status}`);
process.exit(status === "PASS" ? 0 : 1);
