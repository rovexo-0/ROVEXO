import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createListingSchema } from "@/lib/sell/listing-api-schema";
import { buildPublishSuccessPayload, getListingCanonicalPath } from "@/lib/sell/publish-success";
import { validateListingAgainstProhibitedEngine } from "@/lib/sell/category-engine-v1";
import { isOwnedListingStoragePath } from "@/lib/sell/draft-restore-sanitize-v1";

const root = process.cwd();
const read = (relative: string) => readFileSync(join(root, relative), "utf8");

function postHandler(source: string): string {
  const start = source.indexOf("export async function POST");
  expect(start).toBeGreaterThanOrEqual(0);
  return source.slice(start);
}

function functionSlice(source: string, startMarker: string, nextMarker: string): string {
  const start = source.indexOf(startMarker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf(nextMarker, start + startMarker.length);
  return source.slice(start, end > start ? end : undefined);
}

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

const PUBLISH_JSON_KEYS = [
  "listingId",
  "listingSlug",
  "listingUrl",
  "sellerId",
  "listingStatus",
  "publishedAt",
  "title",
  "imageUrl",
] as const;

describe("listings publish P0 speed — storage attach + after() ISR", () => {
  it("1. listing can publish without awaiting full ISR revalidation", () => {
    const route = read("app/api/listings/route.ts");
    const post = postHandler(route);
    expect(route).toContain('import { NextResponse, after } from "next/server"');
    expect(post).toContain("after(async () => {");
    expect(post).not.toMatch(/await\s+revalidatePublishedListing/);
    const afterIdx = post.indexOf("after(async () => {");
    const jsonIdx = post.indexOf("return NextResponse.json({ listing, publish })");
    const isrIdx = post.indexOf("revalidatePublishedListing(listing.slug)");
    expect(afterIdx).toBeGreaterThan(-1);
    expect(isrIdx).toBeGreaterThan(afterIdx);
    expect(jsonIdx).toBeGreaterThan(afterIdx);
    expect(isrIdx).toBeLessThan(jsonIdx);
  });

  it("2. publish response preserves the exact existing JSON contract", () => {
    const payload = buildPublishSuccessPayload(
      {
        id: "listing-1",
        slug: "nike-trainers-abc123",
        title: "Nike Trainers",
        status: "published",
        createdAt: "2026-08-24T20:00:00.000Z",
        imageUrl: "https://cdn.example.com/a.jpg",
        thumbnailUrl: "https://cdn.example.com/a-thumb.jpg",
      },
      "seller-1",
      "https://www.rovexo.co.uk",
    );

    expect(Object.keys(payload)).toEqual([...PUBLISH_JSON_KEYS]);
    expect(payload.listingId).toBe("listing-1");
    expect(payload.listingUrl).toBe("https://www.rovexo.co.uk/listing/nike-trainers-abc123");
    expect(payload.imageUrl).toBe("https://cdn.example.com/a-thumb.jpg");

    const route = read("app/api/listings/route.ts");
    expect(route).toContain("return NextResponse.json({ listing, publish })");
    expect(route).toContain("buildPublishSuccessPayload(listing, auth.user.id, origin)");
  });

  it("3. listingId is returned immediately after successful core persistence", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    const ready = post.indexOf('publishPerfLog("CREATE_RESULT_READY")');
    const responseStart = post.indexOf('publishPerfLog("RESPONSE_START")');
    const afterIdx = post.indexOf("after(async () => {");
    const jsonIdx = post.indexOf("return NextResponse.json({ listing, publish })");
    expect(ready).toBeGreaterThan(post.indexOf("createSellerListing({"));
    expect(responseStart).toBeGreaterThan(ready);
    expect(afterIdx).toBeGreaterThan(responseStart);
    expect(jsonIdx).toBeGreaterThan(afterIdx);
  });

  it("4. listingUrl remains the canonical /listing/{slug} URL", () => {
    expect(getListingCanonicalPath("nike-trainers-abc123")).toBe("/listing/nike-trainers-abc123");
    const payload = buildPublishSuccessPayload(
      {
        id: "id-1",
        slug: "nike-trainers-abc123",
        title: "Nike Trainers",
        status: "published",
        createdAt: "2026-08-24T20:00:00.000Z",
        imageUrl: "https://cdn.example.com/a.jpg",
        thumbnailUrl: null,
      },
      "seller-1",
      "https://www.rovexo.co.uk/",
    );
    expect(payload.listingUrl).toBe("https://www.rovexo.co.uk/listing/nike-trainers-abc123");
  });

  it("5–6. primary image remains index 0 and sortOrder stays deterministic", () => {
    const insert = functionSlice(
      read("lib/listings/repository.ts"),
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).toContain("sort_order: image.sortOrder ?? index");
    expect(insert).toContain("is_primary: image.isPrimary ?? index === 0");
    expect(insert).toContain("images.map((image, index) => attachOwnedExistingImage(image, sellerId, index))");

    const parsed = createListingSchema.parse({
      title: "Nike Air Max 90",
      description: "Great trainers in good condition.",
      condition: "Good",
      price: 49.99,
      acceptOffers: true,
      categoryPath: {
        categorySlug: "mens-fashion",
        subcategorySlug: "shoes",
        childCategorySlug: "trainers",
      },
      images: [
        {
          url: "https://cdn.example.com/0.jpg",
          storagePath: `${USER_A}/temp/session/0.jpg`,
          sortOrder: 0,
          isPrimary: true,
        },
        {
          url: "https://cdn.example.com/1.jpg",
          storagePath: `${USER_A}/temp/session/1.jpg`,
          sortOrder: 1,
          isPrimary: false,
        },
      ],
    });
    expect(parsed.images[0]?.sortOrder).toBe(0);
    expect(parsed.images[0]?.isPrimary).toBe(true);
    expect(parsed.images[1]?.sortOrder).toBe(1);
    expect(parsed.images[1]?.isPrimary).toBe(false);
  });

  it("7. required image cannot disappear before response", () => {
    const attach = functionSlice(
      read("lib/listings/repository.ts"),
      "async function attachOwnedExistingImage",
      "async function moveImageToProductFolder",
    );
    expect(attach).toContain("storageObjectExists");
    expect(attach).toContain(
      'throw new Error("Unable to save listing images. Please re-upload your photos and try again.")',
    );
    const create = functionSlice(
      read("lib/listings/repository.ts"),
      "export async function createSellerListing",
      "export async function updateSellerListing",
    );
    expect(create).toContain("listing rolled back");
    expect(create).toContain("insertProductImages(product.id, input.sellerId, input.images)");
  });

  it("8. storage ownership is preserved", () => {
    expect(isOwnedListingStoragePath(`${USER_B}/temp/session/photo.jpg`, USER_A)).toBe(false);
    expect(isOwnedListingStoragePath(`${USER_A}/temp/session/photo.jpg`, USER_A)).toBe(true);
    const attach = functionSlice(
      read("lib/listings/repository.ts"),
      "async function attachOwnedExistingImage",
      "async function moveImageToProductFolder",
    );
    const ownershipIdx = attach.indexOf("image.storagePath.startsWith(`${sellerId}/`)");
    const throwIdx = attach.indexOf('throw new Error("Invalid image storage path.")');
    const existsIdx = attach.indexOf("storageObjectExists");
    expect(ownershipIdx).toBeGreaterThan(-1);
    expect(throwIdx).toBeGreaterThan(ownershipIdx);
    expect(existsIdx).toBeGreaterThan(throwIdx);
  });

  it("9. storage failure cannot produce false success", () => {
    const create = functionSlice(
      read("lib/listings/repository.ts"),
      "export async function createSellerListing",
      "export async function updateSellerListing",
    );
    expect(create).toContain('update({ status: "deleted" })');
    expect(read("lib/listings/repository.ts")).toContain(
      'throw new Error("Unable to save listing images. Please re-upload your photos and try again.")',
    );
    const post = postHandler(read("app/api/listings/route.ts"));
    expect(post).toContain(
      'return NextResponse.json({ error: "Unable to publish listing." }, { status: 500 })',
    );
    expect(post.indexOf("createSellerListing({")).toBeLessThan(
      post.indexOf("return NextResponse.json({ listing, publish })"),
    );
  });

  it("10. ISR failure after successful persistence does not convert publish into HTTP 500", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    const afterBlock = post.slice(post.indexOf("after(async () => {"));
    expect(afterBlock).toContain('console.error("[publish-after] ISR failed"');
    expect(afterBlock).toContain('console.error("[publish-after] storage reconcile failed"');
    expect(post).toContain('console.error("[publish-after] after() registration failed"');
    expect(post).not.toMatch(/await\s+revalidatePublishedListing/);
    const jsonIdx = post.indexOf("return NextResponse.json({ listing, publish })");
    const status500Idx = post.lastIndexOf("{ status: 500 }");
    expect(jsonIdx).toBeGreaterThan(-1);
    expect(status500Idx).toBeGreaterThan(jsonIdx);
  });

  it("11–12. cookie Web publish and Bearer Native publish remain on the same route", () => {
    const listings = read("app/api/listings/route.ts");
    const session = read("lib/auth/session.ts");
    expect(session).toContain("requireApiListingRole");
    expect(listings).toContain("requireApiListingRole");
    expect(listings).not.toContain("/api/native/listings");
    const post = postHandler(listings);
    expect(post.indexOf("requireApiListingRole")).toBeLessThan(post.indexOf("createSellerListing"));
  });

  it("13. profile-completion 428 behavior remains unchanged", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    expect(post).toContain("resolveProfileCompletionRedirect");
    expect(post).toContain("Add your bank account in Settings before publishing your first listing.");
    expect(post).toContain("{ status: 428 }");
    expect(post.indexOf("resolveProfileCompletionRedirect")).toBeLessThan(
      post.indexOf("createSellerListing({"),
    );
  });

  it("14. prohibited-category validation remains unchanged", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    expect(post).toContain("validateListingAgainstProhibitedEngine");
    expect(post.indexOf("validateListingAgainstProhibitedEngine")).toBeLessThan(
      post.indexOf("createSellerListing({"),
    );
    const gate = validateListingAgainstProhibitedEngine({
      title: "Illegal handgun for sale",
      description: "Brand new firearm pistol ready to ship",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("PROHIBITED_ITEM");
  });

  it("does not reduce the published-listing ISR path list", () => {
    const source = read("lib/listings/revalidate-published-listing.ts");
    const start = source.indexOf("export function revalidatePublishedListing");
    const end = source.indexOf("export function revalidateMarketplaceListings");
    const slice = source.slice(start, end);
    const paths = [...slice.matchAll(/revalidatePath\(/g)];
    expect(paths.length).toBe(17);
    const route = read("app/api/listings/route.ts");
    expect(route).toContain("revalidatePublishedListing(listing.slug)");
  });

  it("sync attach does not copy or delete; after() reconcile copies without deleting temps", () => {
    const repo = read("lib/listings/repository.ts");
    const insert = functionSlice(
      repo,
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).not.toContain(".copy(");
    expect(insert).not.toContain(".remove(");

    const recon = functionSlice(
      repo,
      "export async function reconcileTempListingImagesToProductFolder",
      "async function insertDraftProductImageRefs",
    );
    expect(recon).toContain("{ deleteTemp: false }");

    const post = postHandler(read("app/api/listings/route.ts"));
    expect(post).toContain("reconcileTempListingImagesToProductFolder(listing.id, auth.user.id)");
    const afterIdx = post.indexOf("after(async () => {");
    expect(post.indexOf("reconcileTempListingImagesToProductFolder")).toBeGreaterThan(afterIdx);
  });
});
