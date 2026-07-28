import path from "node:path";

/**
 * Resolve a path under the repo root without Turbopack NFT-tracing the entire
 * workspace. Dynamic `path.join(process.cwd(), …)` otherwise pulls `public/`,
 * `reports/`, screenshots, etc. into every serverless function (>250MB).
 *
 * The `turbopackIgnore` comment is required at this call site (Next.js).
 * Infrastructure / tracing only — runtime resolution is unchanged.
 */
export function workspacePath(...segments: string[]): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), ...segments);
}
