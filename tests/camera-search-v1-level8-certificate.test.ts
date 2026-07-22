import { describe, expect, it } from "vitest";
import { CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE } from "@/lib/search/camera-search-v1-level8-certificate";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

describe("Camera Search v1.0 — LEVEL 8 Owner Certificate", () => {
  it("records Owner PRODUCTION CERTIFIED freeze lock", () => {
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.status).toBe("PRODUCTION_CERTIFIED");
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.complete).toBe(true);
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.certified).toBe(true);
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.productionReady).toBe(true);
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.freezeLocked).toBe(true);
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.level).toBe(8);
    expect(CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.certifiedBy).toBe("OWNER_ABSOLUTE_AUTHORITY");
  });

  it("aligns freeze SSOTs to Level 8 certified status", () => {
    expect(CAMERA_SEARCH_V1.status).toBe("PRODUCTION_CERTIFIED_LEVEL_8_FREEZE_LOCKED");
    expect(CAMERA_SEARCH_V1.freezeLocked).toBe(true);
    expect(CAMERA_SEARCH_PERFORMANCE_V1.status).toBe(
      "PRODUCTION_CERTIFIED_LEVEL_8_FREEZE_LOCKED",
    );
    expect(HEADER_MASTER_FREEZE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(HEADER_MASTER_FREEZE_V1.freezeLocked).toBe(true);
  });

  it("locks success gates at 100% PASS", () => {
    const gates = CAMERA_SEARCH_V1_LEVEL8_CERTIFICATE.successGates;
    expect(gates.headerSurvivesNavigation).toBe("PASS");
    expect(gates.avatarSurvivesNavigation).toBe("PASS");
    expect(gates.resultsAppearImmediately).toBe("PASS");
    expect(gates.refreshRequired).toBe("NO");
    expect(gates.secondApiFetchExists).toBe("NO");
    expect(gates.cameraSearchModified).toBe("NO");
    expect(gates.oneHeaderExists).toBe("PASS");
    expect(gates.oneSearchProviderExists).toBe("PASS");
  });
});
