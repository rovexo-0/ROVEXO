#!/usr/bin/env npx tsx

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { resolvePublishedHomepageSections } from "../lib/platform-visual/resolver";
import { HOMEPAGE_BUILDER_SETTING_KEY } from "../lib/super-admin/mission-control/defaults";
import { normalizeHomepageBuilderConfigForLaunch } from "../lib/super-admin/mission-control/normalize-homepage-builder";
import type { HomepageBuilderConfig } from "../lib/super-admin/mission-control/types";
import { getPlatformSetting } from "../lib/super-admin/settings";

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

  const stored = await getPlatformSetting<HomepageBuilderConfig | null>(HOMEPAGE_BUILDER_SETTING_KEY, null);
  if (!stored) {
    console.error("No stored homepage builder config found.");
    process.exit(1);
  }

  const normalized = normalizeHomepageBuilderConfigForLaunch(stored);
  const publishedIds = resolvePublishedHomepageSections(normalized).map((section) => section.id);
  const hero = normalized.components.find((component) => component.id === "hero-slider");

  console.log(`Stored key: ${HOMEPAGE_BUILDER_SETTING_KEY}`);
  console.log(`Hero slider published: ${hero?.published === true ? "yes" : "no"}`);
  console.log(`Published sections: ${publishedIds.join(" → ")}`);

  if (hero?.published) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
