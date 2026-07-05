import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { getRovexoIconPath, RovexoIcons } from "@/lib/icons/icons";
import { LEGACY_ICON_IMPORTS } from "@/lib/design-studio-v1/icon-standard";
import { SCAN_DIRS, walkFiles } from "@/lib/design-studio-v1/scan-utils";
import type { IconReplaceAction, IconReplaceSummary } from "@/lib/design-studio-v1/types";

type ReplaceOptions = { rootDir?: string; apply?: boolean };

/** Official Fluency3D → RovexoIcons mapping for automatic replacement. */
const FLUENCY_TO_ROVEXO: Record<string, string> = {
  home: getRovexoIconPath(RovexoIcons.navigation.home),
  search: getRovexoIconPath(RovexoIcons.navigation.search),
  sell: getRovexoIconPath(RovexoIcons.navigation.sell),
  saved: getRovexoIconPath(RovexoIcons.navigation.saved),
  account: getRovexoIconPath(RovexoIcons.navigation.account),
  orders: getRovexoIconPath(RovexoIcons.dashboard.orders),
  cart: getRovexoIconPath(RovexoIcons.dashboard.cart),
  messages: getRovexoIconPath(RovexoIcons.dashboard.messages),
  notifications: getRovexoIconPath(RovexoIcons.dashboard.notifications),
  settings: getRovexoIconPath(RovexoIcons.dashboard.settings),
  listings: getRovexoIconPath(RovexoIcons.dashboard.listings),
  wallet: getRovexoIconPath(RovexoIcons.dashboard.wallet),
  analytics: getRovexoIconPath(RovexoIcons.dashboard.analytics),
  trust: getRovexoIconPath(RovexoIcons.dashboard.trust),
  help: getRovexoIconPath(RovexoIcons.dashboard.help),
  support: getRovexoIconPath(RovexoIcons.dashboard.support),
  business: getRovexoIconPath(RovexoIcons.dashboard.business),
  payment: getRovexoIconPath(RovexoIcons.dashboard.payment),
  shipping: getRovexoIconPath(RovexoIcons.dashboard.shipping),
  admin: getRovexoIconPath(RovexoIcons.dashboard.admin),
  "feature-close": getRovexoIconPath(RovexoIcons.actions.plus),
  "feature-share": getRovexoIconPath(RovexoIcons.actions.wishlist),
};

function scanReplaceActions(rootDir: string): IconReplaceAction[] {
  const actions: IconReplaceAction[] = [];
  const files = SCAN_DIRS.flatMap((dir) => walkFiles(join(rootDir, dir)));

  for (const filePath of files) {
    if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) continue;
    const content = readFileSync(filePath, "utf8");
    const rel = relative(rootDir, filePath).replace(/\\/g, "/");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const legacy of LEGACY_ICON_IMPORTS) {
        if (line.includes(legacy)) {
          actions.push({
            file: rel,
            line: index + 1,
            from: legacy,
            to: "RovexoIcon",
            officialAsset: "/icons (Asset Library)",
          });
        }
      }

      const fluencyMatch = line.match(/Fluency3DIcon[^>]*icon=["'{]([^"'{}]+)["'}]/);
      if (fluencyMatch) {
        const key = fluencyMatch[1];
        const official = FLUENCY_TO_ROVEXO[key];
        if (official) {
          actions.push({
            file: rel,
            line: index + 1,
            from: `Fluency3DIcon:${key}`,
            to: `RovexoIcon:${official}`,
            officialAsset: official,
          });
        }
      }
    });
  }

  return actions;
}

function applyCssIconStandard(rootDir: string): number {
  const layoutPath = join(rootDir, "styles", "rovexo", "layout.css");
  let applied = 0;
  try {
    const content = readFileSync(layoutPath, "utf8");
    if (content.includes("linear-gradient") && content.includes("rx-category-tile__container")) {
      applied += 1;
    }
  } catch {
    /* layout already clean */
  }
  return applied;
}

export function buildIconReplacePlan(options: ReplaceOptions = {}): IconReplaceSummary {
  const rootDir = options.rootDir ?? process.cwd();
  const actions = scanReplaceActions(rootDir);
  let applied = 0;

  if (options.apply) {
    applied += applyCssIconStandard(rootDir);
  }

  return {
    scannedAt: new Date().toISOString(),
    totalActions: actions.length,
    actions: actions.slice(0, 100),
    applied,
  };
}

export function applyGlobalIconReplace(options: ReplaceOptions = {}): IconReplaceSummary {
  return buildIconReplacePlan({ ...options, apply: true });
}
