import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Listing publish visibility", () => {
  it("syncs verified profile via service role on publish", () => {
    const route = readSource("app/api/listings/route.ts");
    const sync = readSource("lib/profile/auto-verified.ts");

    expect(route).toContain("syncAutoVerifiedProfile");
    expect(route).not.toContain('.update({ verified: true })');
    expect(sync).toContain("createAdminClient");
  });

  it("rolls back listings when images cannot be saved", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("Unable to save listing images");
    expect(repo).toContain("listing rolled back");
  });

  it("applies canonical homepage eligibility to marketplace search results", () => {
    const repo = readSource("lib/listings/repository.ts");
    expect(repo).toContain("HomepageEligibility.filterEligibleRows");
  });
});
