import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK,
  assertCluster4MarketplaceCardsArchitectureOrBlock,
} from "@/lib/listing-card/cluster-4-marketplace-cards-ssot-lock-v1";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".next", "dist", "build", "archive"]);

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsx(full, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function rel(path: string): string {
  return relative(ROOT, path).replace(/\\/g, "/");
}

describe("Cluster 4 Marketplace Cards SSOT Architecture Lock", () => {
  const lock = CLUSTER_4_MARKETPLACE_CARDS_SSOT_LOCK;

  it("is Owner-approved architecture Scope Locked and Production Frozen", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_4_MARKETPLACE_CARDS_IMAGE_SYSTEM");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.searchUxException.isMarketplaceCard).toBe(false);
    expect(lock.searchUxException.isSecondMarketplaceCard).toBe(false);
    assertCluster4MarketplaceCardsArchitectureOrBlock();
  });

  it("allows SearchResultCard imports only from approved Search UX direct importers", () => {
    const allowed = new Set<string>([
      ...lock.searchUxException.allowedDirectImporters,
      lock.searchUxException.path,
    ]);

    const roots = ["app", "features", "components", "lib"].map((d) => join(ROOT, d));
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of walkTsx(root)) {
        const path = rel(file);
        if (allowed.has(path)) continue;
        if (path.startsWith("tests/")) continue;
        const source = readFileSync(file, "utf8");
        if (
          /from\s+["']@\/features\/search\/components\/SearchResultCard["']/.test(source) ||
          /from\s+["']\.\/SearchResultCard["']/.test(source)
        ) {
          offenders.push(path);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps SearchResultCard runtime hosts on Search Overlay / Typeahead only", () => {
    for (const host of lock.searchUxException.allowedRuntimeHosts) {
      const source = readFileSync(join(ROOT, host), "utf8");
      expect(source).toMatch(/SearchSuggestionList|ProductResults/);
    }

    const resultsGrid = readFileSync(
      join(ROOT, "features/search/components/SearchResultsView.tsx"),
      "utf8",
    );
    expect(resultsGrid).toContain("ListingCard");
    expect(resultsGrid).not.toContain("SearchResultCard");
  });

  it("locks ListingCard as marketplace card SSOT path", () => {
    expect(lock.marketplaceCardSsot.path).toBe("components/ui/ListingCard.tsx");
    const card = readFileSync(join(ROOT, lock.marketplaceCardSsot.path), "utf8");
    expect(card).toContain("export const ListingCard");
    expect(card).toContain("SafeImage");
  });
});
