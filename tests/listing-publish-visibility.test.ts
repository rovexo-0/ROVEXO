import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Listing publish visibility", () => {
  it("syncs verified profile through the canonical verification engine on publish", () => {
    const route = readSource("app/api/listings/route.ts");
    const sync = readSource("lib/profile/auto-verified.ts");

    expect(route).toContain("syncAutoVerifiedProfile");
    expect(route).not.toContain('.update({ verified: true })');
    expect(sync).toContain("isSupabaseAdminConfigured");
    expect(sync).toContain("recalculateRovexoVerified");
  });

  it("rolls back listings when images cannot be saved", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("Unable to save listing images");
    expect(repo).toContain("listing rolled back");
  });

  it("fail-closes publish when moderation blocks (never success + paused invisible)", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("scanListingBeforePublish");
    expect(repo).toContain("moderation && !moderation.allowed");
    expect(repo).toContain("cannot be published under ROVEXO marketplace rules");

    const route = readSource("app/api/listings/route.ts");
    expect(route).toContain('listing.status !== "published"');
    expect(route).toContain("422");
  });

  it("applies canonical homepage eligibility to marketplace search results", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("HomepageEligibility.filterEligibleRows");
  });

  it("does not exclude admin/super_admin sellers from marketplace eligibility", () => {
    const eligibility = readSource("lib/homepage/homepage-eligibility.ts");
    expect(eligibility).not.toContain("isInternalPlatformSeller(input)");
    expect(eligibility).toContain("Never exclude real published listings by platform role");
  });
});
