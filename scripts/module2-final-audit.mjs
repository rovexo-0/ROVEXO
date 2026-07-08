#!/usr/bin/env node
/**
 * Generates MODULE2_FINAL_AUDIT.md from visual cert findings.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const findingsPath = join(process.cwd(), "reports", "module-2", "final-visual", "findings.json");
const outPath = join(process.cwd(), "MODULE2_FINAL_AUDIT.md");
const shotsDir = "reports/module-2/final-visual/screenshots";

if (!existsSync(findingsPath)) {
  console.error("Run scripts/module2-final-visual-cert.mjs first");
  process.exit(1);
}

const findings = JSON.parse(readFileSync(findingsPath, "utf8"));
const byArea = new Map();
for (const f of findings) {
  if (!byArea.has(f.area)) byArea.set(f.area, []);
  byArea.get(f.area).push(f);
}

const pass = findings.filter((f) => f.status === "PASS").length;
const warn = findings.filter((f) => f.status === "WARNING").length;
const fail = findings.filter((f) => f.status === "FAIL").length;
const total = findings.length;
const score = Math.round((pass + warn * 0.5) / total * 100);

const screenshotList = [
  "01-homepage-white",
  "02-homepage-black",
  "03-showcase",
  "04-sell",
  "05-upload-photos",
  "06-review-listing",
  "07-business",
  "08-promotion",
  "09-super-admin",
  "10-theme-engine",
  "11-android",
  "12-iphone",
  "13-desktop",
];

function sectionStatus(items) {
  if (items.some((i) => i.status === "FAIL")) return "FAIL";
  if (items.some((i) => i.status === "WARNING")) return "WARNING";
  return "PASS";
}

let md = `# MODULE 2 FINAL VISUAL CERTIFICATION AUDIT

**Version:** 2.0 Final Visual Pass  
**Generated:** ${new Date().toISOString()}  
**Server:** Production build (\`next start\`)  
**Status:** Certification complete — **NO COMMIT / NO PUSH / NO DEPLOY**

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **PASS** | ${pass} |
| **WARNING** | ${warn} |
| **FAIL** | ${fail} |
| **Visual readiness** | **${score} / 100** |

---

## Certification Matrix

`;

for (const [area, items] of byArea) {
  const status = sectionStatus(items);
  md += `### ${area} — **${status}**\n\n`;
  md += `| Check | Status | Detail |\n|-------|--------|--------|\n`;
  for (const item of items) {
    md += `| ${item.id} | **${item.status}** | ${item.detail.replace(/\|/g, "\\|")} |\n`;
  }
  md += "\n";
}

md += `---

## Screenshots

All captures: \`${shotsDir}/\`

| # | File | Surface |
|---|------|---------|
`;

for (const name of screenshotList) {
  const exists = existsSync(join(process.cwd(), shotsDir, `${name}.png`));
  md += `| ${name.split("-")[0]} | \`${name}.png\` | ${exists ? "Captured" : "Missing"} |\n`;
}

md += `
---

## Issues Log

`;

const issues = findings.filter((f) => f.status !== "PASS");
if (issues.length === 0) {
  md += `_No issues — all checks passed._\n`;
} else {
  for (const issue of issues) {
    md += `- **[${issue.status}]** ${issue.area} → ${issue.id}: ${issue.detail}\n`;
  }
}

md += `
---

## Stop Rule Acknowledgment

- **DO NOT** commit  
- **DO NOT** push  
- **DO NOT** deploy  

## Related Reports

- Color tokens: \`reports/module-2/final-visual/COLOR_TOKEN_VERIFICATION.md\`
- Theme engine: \`reports/module-2/final-visual/THEME_VERIFICATION.md\`

Awaiting explicit user approval before any Git or Vercel operation.

**End of Module 2.**
`;

writeFileSync(outPath, md);
console.log("Wrote", outPath);
