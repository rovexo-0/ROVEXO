import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("sell publish auth path — session-scoped (no false service-role dependency)", () => {
  it("profile completion uses authenticated session client, not admin", () => {
    const shared = readSource("lib/account/profile-completion.ts");
    expect(shared).not.toContain("createAdminClient");
    expect(shared).not.toContain("createClient");

    const server = readSource("lib/account/profile-completion.server.ts");
    expect(server).toContain('from "@/lib/supabase/server"');
    expect(server).toContain("createClient");
    expect(server).not.toContain("createAdminClient");
    expect(server).toContain("auth.getUser()");
    expect(server).toContain('import "server-only"');
  });

  it("listing image upload uses seller session storage (RLS), not admin", () => {
    const source = readSource("app/api/listings/upload/route.ts");
    expect(source).toContain("createClient");
    expect(source).toContain("supabase.storage.from(\"products\")");
    expect(source).not.toContain("createAdminClient");
  });

  it("temp-to-product image move uses seller session storage, not admin", () => {
    const source = readSource("lib/listings/repository.ts");
    const start = source.indexOf("async function moveImageToProductFolder");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("\nasync function", start + 1);
    const slice = source.slice(start, end > 0 ? end : undefined);
    expect(slice).toContain("createClient()");
    expect(slice).not.toContain("createAdminClient");
  });

  it("temp-to-product image move never persists dangling -thumb URLs", () => {
    const source = readSource("lib/listings/repository.ts");
    const start = source.indexOf("async function moveImageToProductFolder");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("\nasync function", start + 1);
    const slice = source.slice(start, end > 0 ? end : undefined);
    expect(slice).toContain("resolveOwnedListingImageServingUrls");
    expect(source).toContain("preferAvifServingUrls");
    expect(source).toContain("jpegThumbUrl");
  });

  it("pre-publish moderation scan uses session client for duplicate checks", () => {
    const source = readSource("lib/moderation/scan-listing.ts");
    expect(source).toContain('from "@/lib/supabase/server"');
    expect(source).toContain("createClient");
    expect(source).not.toContain("createAdminClient");
  });

  it("applyListingModeration updates products via seller session", () => {
    const source = readSource("lib/moderation/service.ts");
    expect(source).toContain("export async function applyListingModeration");
    expect(source).toMatch(/applyListingModeration[\s\S]*createClient\(\)/);
    expect(source).toMatch(/applyListingModeration[\s\S]*\.eq\("seller_id", input\.sellerId\)/);
  });

  it("transaction mode resolution for listings uses session client, not admin", () => {
    const source = readSource("lib/transaction-mode/server.ts");
    const start = source.indexOf("export async function resolveTransactionModeMapForCategoryIds");
    expect(start).toBeGreaterThanOrEqual(0);
    const end = source.indexOf("export async function updateCategoryTransactionModeCascade");
    const slice = source.slice(start, end > 0 ? end : undefined);
    expect(slice).toContain("createClient()");
    expect(slice).not.toContain("createAdminClient");
  });

  it("category resolve-or-create reads via session and does not hard-require admin for existing rows", () => {
    const source = readSource("lib/categories/server.ts");
    expect(source).toContain("tryCreateAdminClient");
    expect(source).toContain("await createSupabaseCategoryStore()");
    expect(source).toContain("is not provisioned in the database");
  });
});
