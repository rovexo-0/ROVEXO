import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Demo shipping label presentation", () => {
  it("renders a realistic watermarked label instead of developer HTML copy", () => {
    const route = readSource("app/api/shipping/demo-label/route.ts");
    expect(route).toContain("NOT VALID FOR SHIPPING");
    expect(route).toContain("Deliver to");
    expect(route).toContain("Tracking number");
    expect(route).toContain("Sender");
    expect(route).toContain("Return address");
    expect(route).toContain("Parcel reference");
    expect(route).toContain("Marketplace reference");
    expect(route).toContain("buildDemoQrSvg");
    expect(route).toContain("buildDemoBarcodeSvg");
    expect(route).not.toContain("ROVEXO Virtual Shipping Label");
    expect(route).not.toContain("FULL DEMO");
    expect(route).not.toContain("Use Print in the browser to print this certification label");
    expect(route).not.toContain("Fictional demo label for ROVEXO certification");
  });

  it("always resolves live demo presentation URLs and never snapshots demo HTML", () => {
    const adapter = readSource("lib/shipping/pricing/demo-adapter.ts");
    const server = readSource("lib/shipping/server.ts");
    const labelsApi = readSource("app/api/shipping/labels/route.ts");
    expect(adapter).toContain("buildDemoShippingLabelPresentationUrl");
    expect(adapter).toContain("isDemoShippingTrackingNumber");
    expect(server).toContain("isDemoShippingTrackingNumber");
    expect(server).toContain("!isDemoShippingTrackingNumber(label.trackingNumber)");
    expect(labelsApi).toContain("buildDemoShippingLabelPresentationUrl");
    expect(labelsApi).toContain("isDemoShippingTrackingNumber");
  });
});
