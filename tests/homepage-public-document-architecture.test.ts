/**
 * COD SÂNGE — Homepage public document vs user-state split.
 * Asserts cookie-free PUBLIC catalogue path + private draft isolation + no auth on `/` SSR.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

describe("Homepage performance architecture — public document / user-state split", () => {
  it("public `/` page has no cookies/searchParams/getAuthContext Dynamic APIs", () => {
    const page = read("app/(platform)/page.tsx");
    expect(page).toContain("export const revalidate = 60");
    expect(page).toContain("loadHomepageDocumentData");
    expect(page).toContain('previewMode: "live"');
    expect(page).toContain("CanonicalHomepage");
    expect(page).not.toContain("await searchParams");
    expect(page).not.toContain("getAuthContext");
    expect(page).not.toContain("getUserRole");
    expect(page).not.toContain('from "@/lib/supabase/server"');
    expect(page).not.toContain("cookies(");
  });

  it("draft visual preview is force-dynamic and auth-gated on a private route", () => {
    const draft = read("app/(platform)/homepage-visual-draft/page.tsx");
    expect(draft).toContain('export const dynamic = "force-dynamic"');
    expect(draft).toContain("getAuthContext");
    expect(draft).toContain("getUserRole");
    expect(draft).toContain('role === "super_admin"');
    expect(draft).toContain('previewMode = "draft"');
    expect(draft).toContain("robots: { index: false, follow: false }");
  });

  it("middleware rewrites /?visualPreview=draft to the private draft route", () => {
    const mw = read("middleware.ts");
    expect(mw).toContain('searchParams.get("visualPreview") === "draft"');
    expect(mw).toContain('url.pathname = "/homepage-visual-draft"');
  });

  it("homepage feed + showcase use public catalogue client (no createClient cookies)", () => {
    const repo = read("lib/products/repository.ts");
    expect(repo).toContain("createPublicCatalogueClient");
    // Homepage feed block must not call cookie createClient
    const feedStart = repo.indexOf("export async function getHomepageFeed");
    const feedEnd = repo.indexOf("export async function getShowcaseSellerSections");
    const feedBlock = repo.slice(feedStart, feedEnd);
    expect(feedBlock).toContain("createPublicCatalogueClient");
    expect(feedBlock).not.toMatch(/await createClient\(\)/);

    const showcaseStart = repo.indexOf("export async function getShowcaseSellerSections");
    const showcaseEnd = repo.indexOf("export const getProductBySlug");
    const showcaseBlock = repo.slice(showcaseStart, showcaseEnd);
    expect(showcaseBlock).toContain("createPublicCatalogueClient");
    expect(showcaseBlock).not.toContain("await createClient()");
  });

  it("public catalogue client is server-only service role", () => {
    expect(existsSync(path.join(ROOT, "lib/supabase/public-catalogue-client.ts"))).toBe(true);
    const client = read("lib/supabase/public-catalogue-client.ts");
    expect(client).toContain('import "server-only"');
    expect(client).toContain("tryCreateAdminClient");
    expect(client).toContain("PUBLIC catalogue");
    expect(client).toContain("getSupabaseAnonKey");
  });

  it("anonymous middleware skips getUser when no auth cookie", () => {
    const mw = read("lib/supabase/middleware.ts");
    expect(mw).toContain("hasAuthCookie");
    expect(mw).toContain('cookie.name.includes("-auth-token")');
    expect(mw).toContain("if (hasAuthCookie)");
    expect(mw).not.toContain("opt-p0-perf-09");
  });

  it("loader never imports session cookies or identity for live document data", () => {
    const loader = read("lib/homepage/load-homepage-document.ts");
    expect(loader).toContain('import "server-only"');
    expect(loader).not.toContain("getAuthContext");
    expect(loader).not.toContain('from "@/lib/supabase/server"');
    expect(loader).toContain("fetchHomepageFeed");
    expect(loader).toContain("fetchShowcaseSellerSections");
    expect(loader).toContain("listActivePreferredMarketplaceStores");
    expect(loader).toContain("toPublicProductDocument");
  });

  it("anonymous Homepage middleware sets public CDN Cache-Control matching revalidate=60", () => {
    const mw = read("middleware.ts");
    expect(mw).toContain("isAnonymousHomepage");
    expect(mw).toContain("public, s-maxage=60, stale-while-revalidate=300");
  });
});
