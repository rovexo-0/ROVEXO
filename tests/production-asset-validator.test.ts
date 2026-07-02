import { describe, expect, it } from "vitest";
import { validateProductionAssets } from "@/lib/super-admin/production-assets/validator";

describe("production asset validator", () => {
  it("passes for approved premium photography assets", async () => {
    const report = await validateProductionAssets();
    expect(report.summary.placeholderAssets).toBe(0);
    expect(report.responsiveImages.category).toBe(true);
    expect(report.responsiveImages.hero).toBe(true);
    expect(report.deploymentReady).toBe(true);
    expect(report.status).toBe("passed");
  });

  it("reports all homepage visual sections", async () => {
    const report = await validateProductionAssets();
    expect(report.sections["category-rail"].status).toBe("passed");
    expect(report.sections["hero-campaigns"].status).toBe("passed");
    expect(report.sections["featured-listings"].status).toBe("passed");
  });
});
