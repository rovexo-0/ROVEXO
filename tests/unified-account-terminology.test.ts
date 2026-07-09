import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCAN_DIRS = [
  "app",
  "components",
  "features",
  "lib/account-center",
  "lib/navigation",
  "lib/mobile-ui",
  "lib/profile",
  "lib/auth",
  "lib/rovexo-ideas",
  "lib/help/content",
  "lib/ai-assistant",
];

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", "super-admin"]);
const SKIP_FILES = new Set([
  "app/fluency-3d-preview/page.tsx",
  "features/super-admin/enterprise-business-intelligence/EnterpriseBiAdmin.tsx",
]);

const FORBIDDEN_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Buyer Dashboard", pattern: /Buyer Dashboard/i },
  { label: "Seller Dashboard", pattern: /Seller Dashboard/i },
  { label: "Business Dashboard", pattern: /Business Dashboard/i },
  { label: "Become Seller", pattern: /Become Seller/i },
  { label: "Become Business", pattern: /Become Business/i },
  { label: "Buyer Account", pattern: /Buyer Account/i },
  { label: "Seller Account", pattern: /Seller Account/i },
  { label: "Business Account", pattern: /Business Account/i },
  { label: "Account Type", pattern: /Account Type/i },
  { label: "Switch Role", pattern: /Switch Role/i },
  { label: "Seller Registration", pattern: /Seller Registration/i },
  { label: "Business Registration", pattern: /Business Registration/i },
  { label: "Buyer Registration", pattern: /Buyer Registration/i },
];

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function rel(path: string): string {
  return relative(ROOT, path).replace(/\\/g, "/");
}

describe("ROVEXO unified account terminology v2.1", () => {
  it("contains no legacy buyer/seller/business account labels in user-facing code", () => {
    const offenders: string[] = [];

    for (const dir of SCAN_DIRS) {
      const abs = join(ROOT, dir);
      try {
        statSync(abs);
      } catch {
        continue;
      }

      for (const file of walkFiles(abs)) {
        const relativePath = rel(file);
        if (SKIP_FILES.has(relativePath)) continue;

        const source = readFileSync(file, "utf8");
        for (const rule of FORBIDDEN_PATTERNS) {
          if (rule.pattern.test(source)) {
            offenders.push(`${relativePath} → ${rule.label}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
