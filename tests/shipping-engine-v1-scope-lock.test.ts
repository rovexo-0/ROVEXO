import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SHIPPING_ENGINE_V1_SCOPE_LOCK,
  assertShippingEngineV1ScopeLock,
} from "@/lib/shipping/shipping-engine-v1-scope-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Shipping Engine v1.0 Scope Lock", () => {
  it("is Owner-approved and scope-locked", () => {
    const lock = assertShippingEngineV1ScopeLock();
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_3_SHIPPING_ENGINE");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
  });

  it("locks canonical live surfaces only", () => {
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.canonicalLive).toContain("Sendcloud Runtime");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.canonicalLive).toContain("Auto Single Parcel");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.canonicalLive).toContain("ShippingLabelViewer");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.canonicalLive).toContain(
      "Conversation Hub PRINT LABEL",
    );
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.canonicalLive).not.toContain("ShipmentWizard UI");
  });

  it("defers multi-parcel and ShippingEngineHub to v1.1 without deleting APIs", () => {
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.deferredToV1_1).toContain("ShipmentWizard UI");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.deferredToV1_1).toContain("Multi-Parcel Seller UI");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.deferredToV1_1).toContain("ShippingEngineHub");
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.rules.doNotDeleteSchemaOrApis).toBe(true);
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.rules.multiParcelUiForbiddenInV1).toBe(true);
  });

  it("excludes deferred UI from Cluster 3 release package", () => {
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.releaseExclude).toContain(
      "features/shipping/ShippingEngineHub.tsx",
    );
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.releaseExclude).toContain(
      "features/shipping/components/ShipmentWizard.tsx",
    );
    expect(SHIPPING_ENGINE_V1_SCOPE_LOCK.releaseInclude).toContain(
      "features/shipping/components/ShippingLabelViewer.tsx",
    );
  });

  it("marks deferred surfaces in source", () => {
    expect(readSource("features/shipping/ShippingEngineHub.tsx")).toContain("DEFERRED TO v1.1");
    expect(readSource("features/shipping/components/ShipmentWizard.tsx")).toContain(
      "DEFERRED TO v1.1",
    );
    expect(readSource("app/(platform)/shipping/page.tsx")).toContain("Scope Lock");
  });
});
