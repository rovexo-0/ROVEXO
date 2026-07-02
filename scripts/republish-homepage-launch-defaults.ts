#!/usr/bin/env npx tsx
/**
 * Republish approved ROVEXO launch homepage defaults to platform_settings.
 *
 * Usage:
 *   npm run db:republish-homepage
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (or service role via linked Supabase env).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { republishLaunchHomepageDefaults } from "../lib/super-admin/mission-control/republish-launch-homepage";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  const contents = readFileSync(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const result = await republishLaunchHomepageDefaults(process.env.HOMEPAGE_REPUBLISH_ACTOR_ID ?? null);

  console.log("Republished launch homepage defaults.");
  console.log(`Updated keys: ${result.updatedKeys.join(", ")}`);
  console.log(`Published sections: ${result.publishedSectionIds.join(" → ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
