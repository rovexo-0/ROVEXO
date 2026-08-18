/**
 * Homepage infinite feed — eligible-item pagination (batch size 12 is not a cap).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectEligibleHomepageFeedPage } from "@/lib/products/homepage-feed-eligible-pagination-v1";

const PAGE_SIZE = 12;

type Row = {
  id: string;
  eligible: boolean;
  sellerId: string;
};

function eligibleRow(id: number, sellerId = "seller-a"): Row {
  return { id: `e-${id}`, eligible: true, sellerId };
}

function ineligibleRow(id: number, sellerId = "seller-a"): Row {
  return { id: `i-${id}`, eligible: false, sellerId };
}

function makeFetch(rows: Row[], holidayHiddenIds: Set<string> = new Set()) {
  return async (fromInclusive: number, toInclusive: number) => {
    const fetched = rows.slice(fromInclusive, toInclusive + 1);
    return {
      fetchedCount: fetched.length,
      rows: fetched.filter((row) => !holidayHiddenIds.has(row.id)),
    };
  };
}

async function pageOf(rows: Row[], page: number, options?: { holidayHiddenIds?: Set<string>; scanWindowSize?: number }) {
  return collectEligibleHomepageFeedPage({
    page,
    pageSize: PAGE_SIZE,
    scanWindowSize: options?.scanWindowSize,
    fetchScanWindow: makeFetch(rows, options?.holidayHiddenIds),
    isEligible: (row) => row.eligible,
    getId: (row) => row.id,
  });
}

async function collectAllPages(rows: Row[], options?: { holidayHiddenIds?: Set<string>; scanWindowSize?: number }) {
  const pages: Array<{ page: number; ids: string[]; hasMore: boolean }> = [];
  let page = 1;
  while (page < 50) {
    const result = await pageOf(rows, page, options);
    pages.push({ page, ids: result.items.map((row) => row.id), hasMore: result.hasMore });
    if (!result.hasMore) break;
    page += 1;
  }
  return pages;
}

describe("Homepage feed eligible-item pagination", () => {
  it("17 eligible: page 1 = 12 / hasMore=true; page 2 = 5 / hasMore=false; 17 unique; 0 duplicates", async () => {
    const rows = Array.from({ length: 17 }, (_, i) => eligibleRow(i + 1));
    const p1 = await pageOf(rows, 1);
    const p2 = await pageOf(rows, 2);
    const p3 = await pageOf(rows, 3);

    expect(p1.items).toHaveLength(12);
    expect(p1.hasMore).toBe(true);
    expect(p2.items).toHaveLength(5);
    expect(p2.hasMore).toBe(false);
    expect(p3.items).toHaveLength(0);
    expect(p3.hasMore).toBe(false);

    const ids = [...p1.items, ...p2.items].map((row) => row.id);
    expect(ids).toEqual(rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(17);
  });

  it("13 eligible: page 1 = 12 / hasMore=true; page 2 = 1 / hasMore=false", async () => {
    const rows = Array.from({ length: 13 }, (_, i) => eligibleRow(i + 1));
    const p1 = await pageOf(rows, 1);
    const p2 = await pageOf(rows, 2);
    expect(p1.items.map((row) => row.id)).toEqual(rows.slice(0, 12).map((row) => row.id));
    expect(p1.hasMore).toBe(true);
    expect(p2.items.map((row) => row.id)).toEqual(["e-13"]);
    expect(p2.hasMore).toBe(false);
  });

  it("12 eligible: page 1 = 12 / hasMore=false", async () => {
    const rows = Array.from({ length: 12 }, (_, i) => eligibleRow(i + 1));
    const p1 = await pageOf(rows, 1);
    expect(p1.items).toHaveLength(12);
    expect(p1.hasMore).toBe(false);
    const p2 = await pageOf(rows, 2);
    expect(p2.items).toHaveLength(0);
    expect(p2.hasMore).toBe(false);
  });

  it("37 eligible: 12 / 12 / 12 / 1 with hasMore true / true / true / false", async () => {
    const rows = Array.from({ length: 37 }, (_, i) => eligibleRow(i + 1));
    const p1 = await pageOf(rows, 1);
    const p2 = await pageOf(rows, 2);
    const p3 = await pageOf(rows, 3);
    const p4 = await pageOf(rows, 4);
    expect(p1.items).toHaveLength(12);
    expect(p1.hasMore).toBe(true);
    expect(p2.items).toHaveLength(12);
    expect(p2.hasMore).toBe(true);
    expect(p3.items).toHaveLength(12);
    expect(p3.hasMore).toBe(true);
    expect(p4.items).toHaveLength(1);
    expect(p4.hasMore).toBe(false);
    const ids = [...p1.items, ...p2.items, ...p3.items, ...p4.items].map((row) => row.id);
    expect(ids).toEqual(rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(37);
  });

  it("does not treat a short DB scan window as hasMore=false when more eligible remain", async () => {
    const rows = Array.from({ length: 17 }, (_, i) => eligibleRow(i + 1));
    const p1 = await pageOf(rows, 1, { scanWindowSize: 36 });
    expect(p1.items).toHaveLength(12);
    expect(p1.hasMore).toBe(true);
  });

  it("ineligible rows between eligible rows do not consume batch capacity", async () => {
    const rows: Row[] = [];
    for (let i = 1; i <= 17; i += 1) {
      rows.push(eligibleRow(i));
      rows.push(ineligibleRow(i));
    }
    const p1 = await pageOf(rows, 1);
    const p2 = await pageOf(rows, 2);
    expect(p1.items).toHaveLength(12);
    expect(p1.hasMore).toBe(true);
    expect(p1.items.map((row) => row.id)).toEqual(Array.from({ length: 12 }, (_, i) => `e-${i + 1}`));
    expect(p2.items.map((row) => row.id)).toEqual(["e-13", "e-14", "e-15", "e-16", "e-17"]);
    expect(p2.hasMore).toBe(false);
  });

  it("Holiday Mode hidden rows do not consume eligible batch capacity", async () => {
    const rows = Array.from({ length: 17 }, (_, i) => eligibleRow(i + 1));
    const holidayHiddenIds = new Set(["e-3", "e-4"]);
    const p1 = await pageOf(rows, 1, { holidayHiddenIds });
    const p2 = await pageOf(rows, 2, { holidayHiddenIds });
    expect(p1.items.map((row) => row.id)).toEqual([
      "e-1",
      "e-2",
      "e-5",
      "e-6",
      "e-7",
      "e-8",
      "e-9",
      "e-10",
      "e-11",
      "e-12",
      "e-13",
      "e-14",
    ]);
    expect(p1.hasMore).toBe(true);
    expect(p2.items.map((row) => row.id)).toEqual(["e-15", "e-16", "e-17"]);
    expect(p2.hasMore).toBe(false);
  });

  it("includes eligible listings from multiple sellers with no seller filter", async () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => eligibleRow(i + 1, "mishuu")),
      ...Array.from({ length: 7 }, (_, i) => eligibleRow(i + 11, "oly90")),
    ];
    const p1 = await pageOf(rows, 1);
    const p2 = await pageOf(rows, 2);
    const sellers = new Set([...p1.items, ...p2.items].map((row) => row.sellerId));
    expect(sellers).toEqual(new Set(["mishuu", "oly90"]));
    expect(p1.items.some((row) => row.sellerId === "oly90")).toBe(true);
    expect(p2.items.every((row) => row.sellerId === "oly90")).toBe(true);
  });

  it("preserves catalogue order of eligible rows (no re-sort inside pagination)", async () => {
    const rows = [eligibleRow(3), ineligibleRow(1), eligibleRow(1), eligibleRow(2)];
    const p1 = await pageOf(rows, 1);
    expect(p1.items.map((row) => row.id)).toEqual(["e-3", "e-1", "e-2"]);
  });

  it("never duplicates or skips eligible IDs across all pages", async () => {
    const rows: Row[] = [];
    for (let i = 1; i <= 100; i += 1) {
      if (i % 5 === 0) rows.push(ineligibleRow(i));
      else rows.push(eligibleRow(i, i % 2 === 0 ? "a" : "b"));
    }
    const expected = rows.filter((row) => row.eligible).map((row) => row.id);
    const pages = await collectAllPages(rows, { scanWindowSize: 10 });
    const ids = pages.flatMap((page) => page.ids);
    expect(ids).toEqual(expected);
    expect(new Set(ids).size).toBe(expected.length);
    expect(pages.at(-1)?.hasMore).toBe(false);
    expect(pages.slice(0, -1).every((page) => page.hasMore)).toBe(true);
  });
});

describe("Homepage feed pagination wiring + infinite-scroll contract", () => {
  const repo = readFileSync(join(process.cwd(), "lib/products/repository.ts"), "utf8");
  const feedStart = repo.indexOf("export async function getHomepageFeed");
  const feedEnd = repo.indexOf("export async function getShowcaseSellerSections");
  const feedBlock = repo.slice(feedStart, feedEnd);
  const ui = readFileSync(
    join(process.cwd(), "components/homepage/canonical/CanonicalMarketplaceFeed.tsx"),
    "utf8",
  );

  it("keeps batch size 12 and does not raise it to a catalogue cap", () => {
    expect(repo).toContain("const HOMEPAGE_FEED_PAGE_SIZE = 12");
    expect(feedBlock).not.toMatch(/HOMEPAGE_FEED_PAGE_SIZE\s*=\s*(17|24|36|50)/);
  });

  it("paginates the eligible stream via collectEligibleHomepageFeedPage", () => {
    expect(feedBlock).toContain("collectEligibleHomepageFeedPage");
    expect(feedBlock).toContain("hasMore: streamHasMore");
    expect(feedBlock).not.toContain("targetFrom");
    expect(feedBlock).not.toContain("items.length >= pageSize && !exhausted");
    expect(feedBlock).not.toMatch(/scanFrom = targetFrom/);
  });

  it("preserves published / not-demo / stock / eligibility / holiday / sort / no seller filter", () => {
    expect(feedBlock).toContain('.eq("status", "published")');
    expect(feedBlock).toContain('.eq("is_demo", false)');
    expect(feedBlock).toContain('.gt("stock", 0)');
    expect(feedBlock).toContain("applyHolidayModeVisibilityFilter");
    expect(feedBlock).toContain("HomepageEligibility.isRowEligible");
    expect(feedBlock).toContain('.order("promotion_score", { ascending: false })');
    expect(feedBlock).toContain('.order("created_at", { ascending: false })');
    expect(feedBlock).toContain('.order("views", { ascending: false })');
    expect(feedBlock).not.toContain("seller_id");
  });

  it("lets the existing sentinel request page 2 when page 1 hasMore=true", () => {
    expect(ui).toContain("Boolean(initialPage.hasMore)");
    expect(ui).toContain("if (!hasMore) return");
    expect(ui).toContain('void loadPage(page + 1, "append")');
    expect(ui).toContain("sentinelRef");
    expect(ui).not.toContain("initialPage.hasMore || seedItems.length > 0");
  });
});
