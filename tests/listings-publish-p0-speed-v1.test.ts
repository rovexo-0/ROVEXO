import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createListingSchema } from "@/lib/sell/listing-api-schema";
import { buildPublishSuccessPayload, getListingCanonicalPath } from "@/lib/sell/publish-success";
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

describe("listings publish P0 speed — Bearer base + storage attach + after() ISR", () => {
  it("1. Bearer Native authentication remains accepted", () => {
    const listings = read("app/api/listings/route.ts");
    const upload = read("app/api/listings/upload/route.ts");
    const auth = read("lib/saved/saved-api-auth-v1.ts");
    expect(listings).toContain("requireCookieOrBearerListingRole");
    expect(upload).toContain("requireCookieOrBearerListingRole");
    expect(auth).toContain("requireSavedApiAuth");
    expect(auth).toContain("verifyBearerAccessToken(token)");
    expect(read("lib/auth/verify-bearer-access-token-v1.ts")).toContain(
      "supabase.auth.getUser(accessToken)",
    );
    const post = postHandler(listings);
    expect(post.indexOf("requireCookieOrBearerListingRole")).toBeLessThan(
      post.indexOf("createSellerListing"),
    );
  });

  it("2. Cookie authentication remains accepted", () => {
    const auth = read("lib/saved/saved-api-auth-v1.ts");
    expect(auth).toContain("requireApiAuth(request)");
    expect(auth).toContain("requestHasSupabaseAuthCookie");
    const saved = functionSlice(auth, "export async function requireSavedApiAuth", "export async function requireCookieOrBearerListingRole");
    expect(saved.indexOf("verifyBearerAccessToken")).toBeLessThan(saved.indexOf("requireApiAuth(request)"));
  });

  it("3. Unauthorized request remains rejected", () => {
    const auth = read("lib/saved/saved-api-auth-v1.ts");
    expect(auth).toContain('{ error: "Unauthorized" }');
    expect(auth).toContain("status: 401");
    expect(auth).toContain("if (!user)");
    expect(auth).toContain("return unauthorized()");
  });

  it("4. Owned temporary image is accepted", () => {
    expect(isOwnedListingStoragePath(`${USER_A}/temp/session/photo.jpg`, USER_A)).toBe(true);
    const attach = functionSlice(
      read("lib/listings/repository.ts"),
      "async function attachOwnedExistingImage",
      "async function moveImageToProductFolder",
    );
    expect(attach).toContain("image.storagePath.startsWith(`${sellerId}/`)");
    expect(attach).toContain("storageObjectExists");
    expect(attach).toContain("listingMutationClient()");
  });

  it("5. Foreign image is rejected", () => {
    expect(isOwnedListingStoragePath(`${USER_B}/temp/session/photo.jpg`, USER_A)).toBe(false);
    const attach = functionSlice(
      read("lib/listings/repository.ts"),
      "async function attachOwnedExistingImage",
      "async function moveImageToProductFolder",
    );
    const ownershipIdx = attach.indexOf("image.storagePath.startsWith(`${sellerId}/`)");
    const throwIdx = attach.indexOf('throw new Error("Invalid image storage path.")');
    expect(ownershipIdx).toBeGreaterThan(-1);
    expect(throwIdx).toBeGreaterThan(ownershipIdx);
  });

  it("6. product_images receives the existing public image URL", () => {
    const insert = functionSlice(
      read("lib/listings/repository.ts"),
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).toContain("url: image.url");
    expect(insert).toContain("thumbnail_url: image.thumbnailUrl ?? image.url");
    expect(insert).toContain("storage_path: image.storagePath");
    expect(insert).toContain("attachOwnedExistingImage");
    const attach = functionSlice(
      read("lib/listings/repository.ts"),
      "async function attachOwnedExistingImage",
      "async function moveImageToProductFolder",
    );
    expect(attach).toContain("getPublicStorageUrl(\"products\", image.storagePath)");
    expect(attach).toContain("url: publicUrl");
  });

  it("7. No synchronous Storage copy blocks the response", () => {
    const insert = functionSlice(
      read("lib/listings/repository.ts"),
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).not.toContain(".copy(");
    const post = postHandler(read("app/api/listings/route.ts"));
    const afterIdx = post.indexOf("after(async () => {");
    expect(post.indexOf("reconcileTempListingImagesToProductFolder")).toBeGreaterThan(afterIdx);
  });

  it("8. No synchronous Storage delete blocks the response", () => {
    const insert = functionSlice(
      read("lib/listings/repository.ts"),
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).not.toContain(".remove(");
    const recon = functionSlice(
      read("lib/listings/repository.ts"),
      "export async function reconcileTempListingImagesToProductFolder",
      "async function insertDraftProductImageRefs",
    );
    expect(recon).toContain("{ deleteTemp: false }");
  });

  it("9. ISR is registered with after()", () => {
    const route = read("app/api/listings/route.ts");
    const post = postHandler(route);
    expect(route).toContain('import { NextResponse, after } from "next/server"');
    expect(post).toContain("after(async () => {");
    expect(post).toContain("revalidatePublishedListing(listing.slug)");
  });

  it("10. ISR is not awaited before response", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    expect(post).not.toMatch(/await\s+revalidatePublishedListing/);
    const afterIdx = post.indexOf("after(async () => {");
    const jsonIdx = post.indexOf("return NextResponse.json({ listing, publish })");
    const isrIdx = post.indexOf("revalidatePublishedListing(listing.slug)");
    expect(afterIdx).toBeGreaterThan(-1);
    expect(isrIdx).toBeGreaterThan(afterIdx);
    expect(jsonIdx).toBeGreaterThan(afterIdx);
    expect(isrIdx).toBeLessThan(jsonIdx);
  });

  it("11. ISR failure does not turn persisted listing into HTTP 500", () => {
    const post = postHandler(read("app/api/listings/route.ts"));
    const afterBlock = post.slice(post.indexOf("after(async () => {"));
    expect(afterBlock).toContain('console.error("[publish-after] ISR failed"');
    expect(afterBlock).toContain('console.error("[publish-after] storage reconcile failed"');
    expect(post).toContain('console.error("[publish-after] after() registration failed"');
    const jsonIdx = post.indexOf("return NextResponse.json({ listing, publish })");
    const status500Idx = post.lastIndexOf("{ status: 500 }");
    expect(jsonIdx).toBeGreaterThan(-1);
    expect(status500Idx).toBeGreaterThan(jsonIdx);
  });

  it("12. listingId preserved", () => {
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
    expect(payload.listingId).toBe("listing-1");
    const route = read("app/api/listings/route.ts");
    expect(route).toContain("buildPublishSuccessPayload(listing, auth.user.id, origin)");
    expect(route).toContain("return NextResponse.json({ listing, publish })");
  });

  it("13. listingUrl preserved", () => {
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

  it("14. Primary image index 0 preserved", () => {
    const insert = functionSlice(
      read("lib/listings/repository.ts"),
      "async function insertProductImages",
      "export async function reconcileTempListingImagesToProductFolder",
    );
    expect(insert).toContain("sort_order: image.sortOrder ?? index");
    expect(insert).toContain("is_primary: image.isPrimary ?? index === 0");
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

  it("does not reduce the published-listing ISR path list", () => {
    const source = read("lib/listings/revalidate-published-listing.ts");
    const start = source.indexOf("export function revalidatePublishedListing");
    const end = source.indexOf("export function revalidateMarketplaceListings");
    const slice = source.slice(start, end);
    const paths = [...slice.matchAll(/revalidatePath\(/g)];
    expect(paths.length).toBe(17);
  });
});
