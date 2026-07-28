/**
 * Discover App Router pages for Absolute Blood Law XLV.
 * Filesystem discovery only — no server imports.
 */

import { readdirSync, statSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import path from "node:path";

const SKIP_DIR = new Set([
  "api",
  "node_modules",
  ".next",
  "components",
  "lib",
  "hooks",
  "types",
]);

function walkPages(dir: string, out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIR.has(entry)) continue;
      walkPages(full, out);
      continue;
    }
    if (entry === "page.tsx" || entry === "page.ts" || entry === "page.jsx") {
      out.push(full);
    }
  }
  return out;
}

/** Convert app file path → URL path (dynamic segments kept as placeholders). */
export function filePathToRoute(appRoot: string, filePath: string): string {
  let rel = path.relative(appRoot, path.dirname(filePath)).replaceAll("\\", "/");
  if (rel === ".") return "/";
  // Drop route groups (auth)
  rel = rel
    .split("/")
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
    .join("/");
  return `/${rel}`.replace(/\/+/g, "/");
}

export function discoverAppRoutes(cwd = workspacePath()): string[] {
  const appRoot = path.join(cwd, "app");
  const files = walkPages(appRoot);
  const routes = files
    .map((f) => filePathToRoute(appRoot, f))
    // Skip heavy dynamic-only shells without static entry for guest crawl
    .filter((r) => !r.includes("[") || r === "/listing/[slug]" || r === "/inbox/conversation/[conversationId]")
    .filter((r) => !r.startsWith("/super-admin") || r === "/super-admin")
    .filter((r) => !r.startsWith("/ui-lock") && !r.startsWith("/fluency"));
  return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}

export function isStaticCrawlableRoute(route: string): boolean {
  return !route.includes("[");
}
