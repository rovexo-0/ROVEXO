import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readRepo(): string {
  return readFileSync(join(process.cwd(), "lib/listings/repository.ts"), "utf8");
}

describe("P10.3 dual Storage consumer — draft must not move temp", () => {
  it("defines insertDraftProductImageRefs that never copy/remove Storage", () => {
    const source = readRepo();
    const start = source.indexOf("async function insertDraftProductImageRefs");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("\nexport async function getSellerListingById", start);
    const slice = source.slice(start, end > start ? end : undefined);

    expect(slice).toContain("storageObjectExists");
    expect(slice).not.toContain(".copy(");
    expect(slice).not.toContain(".remove(");
    expect(slice).not.toContain("moveImageToProductFolder");
    expect(slice).toContain("if (kept.length === 0)");
  });

  it("createSellerListing routes draft away from insertProductImages / move", () => {
    const source = readRepo();
    const start = source.indexOf("export async function createSellerListing");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("\nexport async function updateSellerListing", start);
    const slice = source.slice(start, end > start ? end : undefined);

    expect(slice).toContain('status === "draft"');
    expect(slice).toContain("insertDraftProductImageRefs(product.id, input.sellerId, input.images)");
    expect(slice).toContain("insertProductImages(product.id, input.sellerId, input.images)");
    // Published path remains the sole materializer.
    expect(slice).toMatch(
      /status === "draft"\s*\?\s*insertDraftProductImageRefs[\s\S]*:\s*insertProductImages/,
    );
  });

  it("published request path attaches owned URLs; copy happens after the HTTP response", () => {
    const source = readRepo();
    const insertStart = source.indexOf("async function insertProductImages");
    const insertEnd = source.indexOf("export async function reconcileTempListingImagesToProductFolder", insertStart);
    const insert = source.slice(insertStart, insertEnd > insertStart ? insertEnd : undefined);
    expect(insert).toContain("attachOwnedExistingImage");
    expect(insert).not.toContain(".copy(");
    expect(insert).not.toContain(".remove(");

    const moveStart = source.indexOf("async function moveImageToProductFolder");
    const moveEnd = source.indexOf("\nasync function insertProductImages", moveStart);
    const move = source.slice(moveStart, moveEnd > moveStart ? moveEnd : undefined);
    expect(move).toContain(".copy(");
    expect(move).toContain("if (options?.deleteTemp)");
    expect(move).toContain(".remove([image.storagePath, oldThumbPath])");

    const reconStart = source.indexOf("export async function reconcileTempListingImagesToProductFolder");
    const reconEnd = source.indexOf("async function insertDraftProductImageRefs", reconStart);
    const recon = source.slice(reconStart, reconEnd > reconStart ? reconEnd : undefined);
    expect(recon).toContain("{ deleteTemp: false }");
  });

  it("draft API create still uses createSellerListing with draft status (contract preserved)", () => {
    const draftRoute = readFileSync(join(process.cwd(), "app/api/sell/draft/route.ts"), "utf8");
    expect(draftRoute).toContain("createSellerListing({");
    expect(draftRoute).toContain("status: DRAFT_DATABASE_SSOT_V1.status");
  });
});
