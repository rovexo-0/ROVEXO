import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";
import {
  SMART_MULTI_CAMERA_SESSION_V1,
  assertSmartMultiCameraSessionImplementationGate,
  isSmartMultiCameraSessionImplementationAuthorized,
} from "@/lib/media/smart-multi-camera-session-v1";

describe("Smart Multi Camera Session v1.0 — Absolute Law", () => {
  it("records Phase I–IX LOGIC INTEGRATION CERTIFIED with UI Gate ACTIVE", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.status).toBe(
      "PHASE_I_IX_LOGIC_INTEGRATION_CERTIFIED_UI_GATE_ACTIVE",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.pageStatus).toBe("REVIEW");
    expect(SMART_MULTI_CAMERA_SESSION_V1.uiGate).toBe("ACTIVE");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseISessionEngine.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseIILogicLayer.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseIIICaptureCoordinator.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseIVPhotoCollectionEngine.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseVUploadQueue.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseVIRecoveryEngine.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseVIIPerformanceValidation.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseVIIISsotConsolidation.status).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseIXIntegrationCertification.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.phaseIXIntegrationCertification.component).toBe(
      "INTEGRATION_CERTIFICATION",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.certification.phaseVIIISsotConsolidation).toBe(
      "CERTIFIED",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.certification.phaseIXIntegrationCertification).toBe(
      "CERTIFIED",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.certification.logicModuleIntegration).toBe("CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.minPhotos).toBe(1);
    expect(SMART_MULTI_CAMERA_SESSION_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_SESSION_V1.designRules.noCounter).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.designRules.noUploadAfterEveryPhoto).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.designRules.noConfirmDialogs).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.thumbnailRail.showCountAndCapacity).toBe(false);
    expect(SMART_MULTI_CAMERA_SESSION_V1.nextButton.neverUploadsOneImage).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.nextButton.uploadsCompleteSessionOnly).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.uploadLaw.uploadOnlyAfterDoneOrNext).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.uploadLaw.neverUploadAfterEachCapture).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.failClosed.noPartialPublish).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.certification.finalStatus).toBe("NOT CERTIFIED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.absoluteLaw).toEqual([
      "ONE CAMERA SESSION",
      "ONE PHOTO RAIL",
      "ONE NEXT BUTTON",
      "ONE UPLOAD",
      "ONE RETURN TO SELL",
    ]);
  });

  it("keeps Owner master image and Master Spec docs present", () => {
    const master = path.join(
      process.cwd(),
      "docs/modules/smart-multi-camera-session/assets/smart-multi-camera-session-v1-owner-master.png",
    );
    const eng = path.join(
      process.cwd(),
      "docs/modules/smart-multi-camera-session/MASTER_ENGINEERING_SPECIFICATION.md",
    );
    const ui = path.join(
      process.cwd(),
      "docs/modules/smart-multi-camera-session/MASTER_UI_SPECIFICATION.md",
    );
    expect(existsSync(master)).toBe(true);
    expect(existsSync(eng)).toBe(true);
    expect(existsSync(ui)).toBe(true);
    expect(readFileSync(eng, "utf8")).toContain("ONE CAMERA SESSION");
    expect(readFileSync(ui, "utf8")).toMatch(/Big shutter/i);
    expect(readFileSync(ui, "utf8")).toContain("FORBIDDEN");
  });

  it("blocks UI implementation while Image Pipeline is not CERTIFIED", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.implementationGate).toBe(
      "SMART_MOBILE_IMAGE_PIPELINE_CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.certification.finalStatus).not.toBe("CERTIFIED");
    expect(isSmartMultiCameraSessionImplementationAuthorized()).toBe(false);
    expect(() => assertSmartMultiCameraSessionImplementationGate()).toThrow(
      /SMART MULTI CAMERA SESSION UI BLOCKED/,
    );
  });
});
