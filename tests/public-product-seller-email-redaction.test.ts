/**
 * COD SÂNGE — anonymous public document must never serialize sellerEmail.
 * Counts / presence only — never assert raw email values.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  redactSellerEmailForPublicDocument,
  redactSellerEmailForPublicDocuments,
} from "@/lib/products/public-product-contract-v1";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function sellerEmailTokenCount(payload: string): number {
  return (payload.match(/sellerEmail/g) ?? []).length;
}

function sellerEmailNonNullAssignmentCount(payload: string): number {
  return (payload.match(/sellerEmail["']?\s*:\s*["'][^"']+["']/g) ?? []).length;
}

describe("public product contract — sellerEmail redaction", () => {
  it("omits sellerEmail from public document objects (count=0 after serialize)", () => {
    const input = {
      id: "p1",
      title: "Public listing",
      sellerName: "Seller",
      sellerUsername: "seller_public",
      sellerEmail: "should-not-serialize@example.com",
      sellerAvatar: "/avatar.png",
      rating: 5,
    };
    const redacted = redactSellerEmailForPublicDocument(input);
    expect(Object.prototype.hasOwnProperty.call(redacted, "sellerEmail")).toBe(false);
    expect(redacted.sellerName).toBe("Seller");
    expect(redacted.sellerUsername).toBe("seller_public");
    expect(redacted.sellerAvatar).toBe("/avatar.png");
    expect(redacted.rating).toBe(5);

    const serialized = JSON.stringify(redacted);
    expect(sellerEmailTokenCount(serialized)).toBe(0);
    expect(sellerEmailNonNullAssignmentCount(serialized)).toBe(0);
  });

  it("redacts arrays for public catalogue documents", () => {
    const items = redactSellerEmailForPublicDocuments([
      { id: "a", sellerEmail: "a@example.com" },
      { id: "b", sellerEmail: "b@example.com" },
    ]);
    const serialized = JSON.stringify(items);
    expect(sellerEmailTokenCount(serialized)).toBe(0);
    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe("a");
  });

  it("getProductBySlug applies public document contract before return", () => {
    const repo = read("lib/products/repository.ts");
    const start = repo.indexOf("export const getProductBySlug");
    const end = repo.indexOf("export const getProductBySlugForCheckout");
    const block = repo.slice(start, end);
    expect(block).toContain("toPublicProductDocument");
    // Checkout path must remain a separate function (authenticated/private).
    expect(repo).toContain("export const getProductBySlugForCheckout");
  });

  it("section + similar + eligible listings public paths redact sellerEmail", () => {
    const repo = read("lib/products/repository.ts");
    const sectionStart = repo.indexOf("export async function getProductsBySection");
    const sectionEnd = repo.indexOf("export async function getHomepageFeed");
    expect(repo.slice(sectionStart, sectionEnd)).toContain("toPublicProductDocument");
    const similarStart = repo.indexOf("export async function getSimilarProducts");
    expect(repo.slice(similarStart)).toContain("toPublicProductDocument");
    const eligible = read("lib/listings/eligible-listings.ts");
    expect(eligible).toContain("toPublicProductDocuments");
  });

  it("homepage public loader uses the canonical public document helper", () => {
    const loader = read("lib/homepage/load-homepage-document.ts");
    expect(loader).toContain("toPublicProductDocument");
    expect(loader).not.toMatch(/sellerEmail:\s*null/);
  });

  it("homepage feed API re-applies public document contract before JSON", () => {
    const feedApi = read("app/api/homepage/feed/route.ts");
    expect(feedApi).toContain("toPublicProductDocuments");
    expect(feedApi).not.toMatch(/sellerEmail:\s*null/);
  });

  it("homepage feed + showcase public returns use the canonical helper", () => {
    const repo = read("lib/products/repository.ts");
    expect(repo).toContain('from "@/lib/products/public-product-contract-v1"');
    const feedStart = repo.indexOf("export async function getHomepageFeed");
    const feedEnd = repo.indexOf("export async function getShowcaseSellerSections");
    expect(repo.slice(feedStart, feedEnd)).toContain("toPublicProductDocument");
    const showcaseStart = repo.indexOf("export async function getShowcaseSellerSections");
    const showcaseEnd = repo.indexOf("export const getProductBySlug");
    expect(repo.slice(showcaseStart, showcaseEnd)).toContain("toPublicProductDocument");
  });
});
