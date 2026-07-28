/**
 * Absolute law: lib/supabase/server.ts must never reach the browser.
 * Only API Routes · Route Handlers · Server Components · Server Actions.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SERVER_IMPORT = /from\s+["']@\/lib\/supabase\/server["']|require\(\s*["']@\/lib\/supabase\/server["']\s*\)/;

const CLIENT_ROOTS = [
  "components",
  "features",
  "hooks",
] as const;

const CLIENT_FILE_RE = /\.(tsx|ts|jsx|js)$/;

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist") continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (CLIENT_FILE_RE.test(entry)) out.push(full);
  }
  return out;
}

function isServerOnlyFile(rel: string, source: string): boolean {
  if (source.includes('"server-only"') || source.includes("'server-only'")) return true;
  // Explicit server modules by path convention.
  if (/\.server\.(ts|tsx|js|jsx)$/.test(rel)) return true;
  if (/\/(actions|server)\.(ts|tsx)$/.test(rel)) return true;
  if (rel.includes("/api/")) return true;
  return false;
}

function isClientComponent(source: string): boolean {
  return /^\s*["']use client["']/m.test(source);
}

describe("Absolute law — never import lib/supabase/server in client surfaces", () => {
  it("keeps server.ts as a server-only Next headers client", () => {
    const server = readFileSync(path.join(ROOT, "lib/supabase/server.ts"), "utf8");
    expect(server).toContain('import { cookies } from "next/headers"');
    expect(server).toContain("createServerClient");
    expect(server).not.toMatch(/^\s*["']use client["']/m);
  });

  it("keeps Inbox Event Engine server-only and out of @/lib/inbox barrel", () => {
    const engine = readFileSync(path.join(ROOT, "lib/inbox/inbox-event-engine-v1.ts"), "utf8");
    const barrel = readFileSync(path.join(ROOT, "lib/inbox/index.ts"), "utf8");
    expect(engine).toContain('import "server-only"');
    expect(engine).not.toContain("@/lib/supabase/server");
    expect(barrel).not.toMatch(/export\s+\*\s+from\s+["'][^"']*inbox-event-engine/);
  });

  it("forbids supabase/server imports in Client Components and hooks", () => {
    const violations: string[] = [];

    for (const root of CLIENT_ROOTS) {
      const absRoot = path.join(ROOT, root);
      for (const file of walk(absRoot)) {
        const rel = path.relative(ROOT, file).replaceAll("\\", "/");
        const source = readFileSync(file, "utf8");
        if (!SERVER_IMPORT.test(source)) continue;
        if (isServerOnlyFile(rel, source)) continue;
        if (isClientComponent(source) || rel.includes("/hooks/") || root === "hooks") {
          violations.push(rel);
        }
      }
    }

    const inboxBarrel = readFileSync(path.join(ROOT, "lib/inbox/index.ts"), "utf8");
    if (/export\s+\*\s+from\s+["'][^"']*inbox-event-engine/.test(inboxBarrel)) {
      violations.push("lib/inbox/index.ts (re-exports server engine)");
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
