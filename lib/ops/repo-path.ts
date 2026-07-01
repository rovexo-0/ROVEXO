import path from "node:path";

/**
 * Resolve a path under the repository root.
 * The turbopackIgnore comment prevents Next.js from tracing the entire project at build time.
 */
export function repoPath(...segments: string[]): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), ...segments);
}
