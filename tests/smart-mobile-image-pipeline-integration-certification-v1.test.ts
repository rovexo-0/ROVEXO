import { describe, expect, it } from "vitest";
import {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1,
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  assertIntegratedPipelineModuleInvariants,
  certifySmartMobileImagePipelineLogicModule,
  createIntegratedSmartMobileImagePipeline,
} from "@/lib/media/smart-mobile-image-pipeline";
import { SMART_MOBILE_IMAGE_PIPELINE_V1 } from "@/lib/media/smart-mobile-image-pipeline-v1";

describe("Smart Mobile Image Pipeline — Phase VIII Integration Certification", () => {
  it("exposes logic-module certification SSOT", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.phase).toBe(
      "VIII_INTEGRATION_CERTIFICATION",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.logicModuleIntegration).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1.productUiStatus).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIIIIntegrationCertification.status).toBe(
      "CERTIFIED",
    );
  });

  it("asserts integrated module invariants", () => {
    const pipelineModule = createIntegratedSmartMobileImagePipeline();
    const result = assertIntegratedPipelineModuleInvariants(pipelineModule);
    expect(result.ok).toBe(true);
  });

  it("certifies Scenarios 1–8 and all matrices", () => {
    const result = certifySmartMobileImagePipelineLogicModule();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      expect(result.failures).toEqual([]);
      return;
    }
    expect(result.scenarios).toHaveLength(8);
    expect(result.scenarios.every((entry) => entry.ok)).toBe(true);
    expect(result.ownership).toBe(true);
    expect(result.dependency).toBe(true);
    expect(result.state).toBe(true);
    expect(result.event).toBe(true);
    expect(result.invariant).toBe(true);
    expect(result.immutability).toBe(true);
  });

  it("regression: Phases I–VII remain CERTIFIED", () => {
    expect(SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_METADATA_ENGINE_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIArchitectureSsot.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIValidationEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIIINormalizationEngine.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseIVMetadataEngine.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVPipelineIntegration.status).toBe("CERTIFIED");
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIPerformanceValidation.status).toBe(
      "CERTIFIED",
    );
    expect(SMART_MOBILE_IMAGE_PIPELINE_V1.phaseVIISsotConsolidation.status).toBe("CERTIFIED");
  });
});
