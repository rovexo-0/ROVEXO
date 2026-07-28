import { describe, expect, it } from "vitest";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";
import {
  SMART_MULTI_CAMERA_SESSION_V1,
  assertSmartMultiCameraSessionImplementationGate,
  isSmartMultiCameraSessionImplementationAuthorized,
} from "@/lib/media/smart-multi-camera-session-v1";

describe("Smart Multi Camera Session v1.0 — gate", () => {
  it("is gated until Smart Mobile Image Pipeline is CERTIFIED", () => {
    expect(SMART_MULTI_CAMERA_SESSION_V1.status).toBe("NEXT_MAJOR_MODULE_GATED");
    expect(SMART_MULTI_CAMERA_SESSION_V1.implementationGate).toBe(
      "SMART_MOBILE_IMAGE_PIPELINE_CERTIFIED",
    );
    expect(SMART_MULTI_CAMERA_SESSION_V1.maxPhotos).toBe(8);
    expect(SMART_MULTI_CAMERA_SESSION_V1.uploadLaw.uploadOnlyAfterDoneOrNext).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.uploadLaw.neverUploadAfterEachCapture).toBe(true);
    expect(SMART_MULTI_CAMERA_SESSION_V1.certification.finalStatus).toBe("NOT CERTIFIED");
  });

  it("blocks implementation while Image Pipeline is not CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.certification.finalStatus).not.toBe("CERTIFIED");
    expect(isSmartMultiCameraSessionImplementationAuthorized()).toBe(false);
    expect(() => assertSmartMultiCameraSessionImplementationGate()).toThrow(
      /SMART MULTI CAMERA SESSION BLOCKED/,
    );
  });
});
