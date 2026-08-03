import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK,
  assertCluster5PhotoSystemArchitectureOrBlock,
} from "@/lib/product-integration/cluster-5-photo-system-scope-lock-v1";
import { SMART_MULTI_CAMERA_SESSION_V1 } from "@/lib/media/smart-multi-camera-session-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 5 Photo System Scope Lock", () => {
  const lock = CLUSTER_5_PHOTO_SYSTEM_SCOPE_LOCK;

  it("is Owner-approved architecture Scope Locked (not Production Freeze)", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_5_PHOTO_SYSTEM_UPLOAD_PIPELINE");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.canonicalAcquisition.primary).toContain("Native OS Gallery");
    expect(lock.deferredToV1_1).toContain("Standalone Smart Multi Camera UI");
    assertCluster5PhotoSystemArchitectureOrBlock();
  });

  it("keeps Multi Camera UI gated and non-required for production upload", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(lock.multiCamera.uiGate).toBe("ACTIVE");
    expect(lock.multiCamera.productionRuntimeDependsOnUi).toBe(false);
    expect(lock.multiCamera.removingUiDoesNotAffectCanonicalUpload).toBe(true);
    expect(readSource("app/(platform)/sell/camera/page.tsx")).toContain('redirect("/sell")');
  });

  it("Sell runtime uses Product Integration only for photo upload", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain('from "@/lib/product-integration"');
    expect(provider).toContain("intakeSellPhotoFromCanonicalEntry");
    expect(provider).toContain("uploadSellListingPhoto");
    expect(provider).not.toContain('from "@/lib/listings/upload-client"');
    expect(provider).not.toContain('from "@/lib/storage/client-images"');

    const featuresSell = [
      "features/sell/ui/SellPhotoRail.tsx",
      "features/sell/ui/SellPhotoFileInput.tsx",
      "features/sell/hooks/usePhotoUpload.ts",
    ];
    for (const file of featuresSell) {
      const source = readSource(file);
      expect(source, file).not.toContain('from "@/lib/listings/upload-client"');
      expect(source, file).not.toContain('from "@/lib/storage/client-images"');
    }
  });

  it("locks OS picker entry and mandatory pipeline surfaces", () => {
    const picker = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(picker).toContain('type="file"');
    expect(picker).toContain("data-product-integration-entry");
    expect(picker).toContain("NATIVE_PHOTO_PICKER_V1");

    const intake = readSource("lib/product-integration/sell-photo-intake-v1.ts");
    expect(intake).toContain("pipelineComposition.process");
    expect(intake).toContain("compressListingImage");

    const orchestration = readSource(
      "lib/product-integration/upload-storage-orchestration-v1.ts",
    );
    expect(orchestration).toContain("createListingThumbnail");
    expect(orchestration).toContain("SELL_UPLOAD_RETRY_DELAYS_MS");
  });
});
