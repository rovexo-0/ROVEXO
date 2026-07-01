import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/** App Router page patterns derived from app directory page.tsx files (e.g. /help/:slug). */
export function collectAppRoutePatterns(appRoot = path.join(process.cwd(), "app")): string[] {
  const patterns: string[] = [];

  const rootPage = path.join(appRoot, "page.tsx");
  if (existsSync(rootPage)) {
    patterns.push("/");
  }

  function walk(dir: string, segments: string[]): void {
    if (!existsSync(dir)) return;

    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (!statSync(fullPath).isDirectory()) continue;

      if (entry === "api") continue;

      const nextSegments =
        entry.startsWith("(") && entry.endsWith(")")
          ? segments
          : [...segments, entry];

      const pageFile = path.join(fullPath, "page.tsx");
      if (existsSync(pageFile)) {
        patterns.push(segmentsToPattern(nextSegments));
      }

      walk(fullPath, nextSegments);
    }
  }

  walk(appRoot, []);
  patterns.push("/auth/signout", "/auth/callback");
  return [...new Set(patterns)].sort();
}

function segmentsToPattern(segments: string[]): string {
  if (segments.length === 0) return "/";

  const normalized = segments.map((segment) => {
    if (segment.startsWith("[...") && segment.endsWith("]")) {
      const name = segment.slice(4, -1);
      return `:${name}*`;
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return `:${segment.slice(1, -1)}`;
    }
    return segment;
  });

  return `/${normalized.join("/")}`;
}

/** Strips query/hash and normalizes trailing slash. */
export function normalizeHref(href: string): string {
  const withoutQuery = href.split(/[?#]/)[0] ?? href;
  if (!withoutQuery || withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

/**
 * Returns true when a static href resolves to an existing App Router page pattern.
 * Dynamic path params in hrefs (e.g. `/orders/abc`) are matched against `:id` segments.
 */
export function hrefMatchesAppRoute(href: string, patterns: string[]): boolean {
  const pathname = normalizeHref(href);
  if (pathname === "/") return patterns.includes("/");

  return patterns.some((pattern) => matchPattern(pathname, pattern));
}

function matchPattern(pathname: string, pattern: string): boolean {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);

  let pathIndex = 0;

  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i]!;
    const pathPart = pathParts[pathIndex];

    if (part.endsWith("*")) {
      return pathIndex < pathParts.length;
    }

    if (part.startsWith(":")) {
      if (!pathPart) return false;
      pathIndex += 1;
      continue;
    }

    if (part !== pathPart) return false;
    pathIndex += 1;
  }

  return pathIndex === pathParts.length;
}

export function findUnmatchedHrefs(
  hrefs: string[],
  patterns: string[],
): string[] {
  const unmatched: string[] = [];

  for (const href of hrefs) {
    if (!href || isExternalHref(href)) continue;
    if (!href.startsWith("/")) continue;

    if (!hrefMatchesAppRoute(href, patterns)) {
      unmatched.push(href);
    }
  }

  return [...new Set(unmatched)].sort();
}
