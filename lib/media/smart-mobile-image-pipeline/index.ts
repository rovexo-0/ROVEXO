/**
 * Smart Mobile Image Pipeline — Phase I–VIII public surface.
 *
 * Phase I: Architecture & SSOT Foundation (CERTIFIED)
 * Phase II: Validation Engine (CERTIFIED)
 * Phase III: Normalization Engine (CERTIFIED)
 * Phase IV: Metadata Engine (CERTIFIED)
 * Phase V: Pipeline Integration (CERTIFIED)
 * Phase VI: Performance Validation (CERTIFIED)
 * Phase VII: SSOT Consolidation (CERTIFIED)
 * Phase VIII: Integration Certification (CERTIFIED · logic module)
 * UI / camera / network / storage remain forbidden.
 */

export {
  SMART_MOBILE_IMAGE_PIPELINE_ENGINE_V1,
  SmartMobileImagePipelineEngine,
  createSmartMobileImagePipelineEngine,
  isPipelineTransitionAllowed,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-engine-v1";

export {
  SMART_MOBILE_IMAGE_PIPELINE_MAX_DIMENSION,
  SMART_MOBILE_IMAGE_PIPELINE_MAX_IMAGES,
  SMART_MOBILE_IMAGE_PIPELINE_MIN_DIMENSION,
  type PipelineErrorCode,
  type PipelineEvent,
  type PipelineEventType,
  type PipelineFailure,
  type PipelineFailureClass,
  type PipelineImage,
  type PipelineImageFormat,
  type PipelineMetadata,
  type PipelineOrientation,
  type PipelineResult,
  type PipelineState,
  type PipelineStatus,
  type PipelineSuccess,
  type ReceivePipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-types-v1";

export {
  SMART_MOBILE_IMAGE_VALIDATION_ENGINE_V1,
  SmartMobileImageValidationEngine,
  createSmartMobileImageValidationEngine,
  evaluateImageValidation,
  isValidationTransitionAllowed,
} from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";

export {
  SMART_MOBILE_IMAGE_VALIDATION_MAX_BYTES,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_DIMENSION,
  SMART_MOBILE_IMAGE_VALIDATION_MAX_IMAGES,
  SMART_MOBILE_IMAGE_VALIDATION_MIN_DIMENSION,
  type ImageValidationResult,
  type ReceiveValidationImageInput,
  type ValidationContext,
  type ValidationEngineErrorCode,
  type ValidationEngineEvent,
  type ValidationEngineEventType,
  type ValidationEngineFailure,
  type ValidationEngineResult,
  type ValidationEngineState,
  type ValidationEngineStatus,
  type ValidationEngineSuccess,
  type ValidationImageRecord,
  type ValidationReason,
  type ValidationVerdict,
} from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export {
  SMART_MOBILE_IMAGE_NORMALIZATION_ENGINE_V1,
  SmartMobileImageNormalizationEngine,
  createSmartMobileImageNormalizationEngine,
  formatCanonicalTimestamp,
  isNormalizationTransitionAllowed,
  normalizeImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";

export type {
  NormalizeImageInput,
  NormalizedImage,
  NormalizedMetadata,
  NormalizationEngineErrorCode,
  NormalizationEngineEvent,
  NormalizationEngineEventType,
  NormalizationEngineStatus,
  NormalizationFailure,
  NormalizationFailureReason,
  NormalizationResult,
  NormalizationState,
  NormalizationSuccess,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";

export {
  SMART_MOBILE_IMAGE_METADATA_ENGINE_V1,
  SmartMobileImageMetadataEngine,
  cloneMetadataRecord,
  compareMetadataRecords,
  createMetadataRecord,
  createMetadataSnapshot,
  createSmartMobileImageMetadataEngine,
  freezeMetadataRecord,
  isMetadataTransitionAllowed,
  mergeMetadataRecord,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";

export type {
  CreateMetadataInput,
  ImageFingerprint,
  ImageIdentifier,
  ImageMetadata,
  MergeMetadataPatch,
  MetadataEngineErrorCode,
  MetadataEngineEvent,
  MetadataEngineEventType,
  MetadataEngineStatus,
  MetadataFailure,
  MetadataFailureReason,
  MetadataRecord,
  MetadataResult,
  MetadataSnapshot,
  MetadataState,
  MetadataSuccess,
  MetadataVersion,
  PipelineMetadataShape,
  ProcessingFlags,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";

export {
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_V1,
  SmartMobileImagePipelineComposition,
  assertPipelineCompositionInvariants,
  certifySmartMobileImagePipelineIntegration,
  createIntegratedSmartMobileImagePipeline,
  createSmartMobileImagePipelineComposition,
  isPipelineIntegrationTransitionAllowed,
  mapValidationReasonToExit,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-v1";

export type { IntegratedSmartMobileImagePipeline } from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-v1";

export type {
  PipelineCompositionInvariantResult,
  PipelineCompositionOwnership,
  PipelineIntegrationErrorCode,
  PipelineIntegrationEvent,
  PipelineIntegrationEventType,
  PipelineIntegrationFailure,
  PipelineIntegrationFailureReason,
  PipelineIntegrationResult,
  PipelineIntegrationState,
  PipelineIntegrationStatus,
  PipelineIntegrationSuccess,
  ProcessPipelineImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-types-v1";

export {
  SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1,
  benchmarkLargeMetadataCollections,
  benchmarkNormalizationEngineCycle,
  benchmarkRepeatedMetadataCreation,
  benchmarkRepeatedNormalization,
  benchmarkRepeatedPipelineComposition,
  benchmarkRepeatedSnapshotCreation,
  benchmarkRepeatedValidation,
  benchmarkValidationEngineCycle,
  runSmartMobileImagePipelinePerformanceBenchmarks,
} from "@/lib/media/smart-mobile-image-pipeline/performance-validation-v1";

export type { PerformanceBenchmarkResult } from "@/lib/media/smart-mobile-image-pipeline/performance-validation-v1";

export {
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_PRODUCERS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_TYPE_COLLISIONS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_INVARIANTS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS,
  SMART_MOBILE_IMAGE_PIPELINE_SSOT_STATE_MATRIX,
  assertSsotDependencyDirection,
  assertSsotEventCollisionsDocumented,
  assertSsotInvariants,
  assertSsotOwnershipMatrix,
  assertSsotOwnershipSingularity,
  certifySmartMobileImagePipelineSsot,
  detectSsotImportCycles,
  generateSmartMobileImagePipelineSsotReport,
} from "@/lib/media/smart-mobile-image-pipeline/ssot-consolidation-v1";

export type {
  SmartMobileImagePipelineSsotIssue,
  SmartMobileImagePipelineSsotIssueCode,
  SmartMobileImagePipelineSsotOwnerDomain,
  SmartMobileImagePipelineSsotReport,
  SmartMobileImagePipelineSsotResult,
} from "@/lib/media/smart-mobile-image-pipeline/ssot-consolidation-v1";

export {
  SMART_MOBILE_IMAGE_PIPELINE_INTEGRATION_CERTIFICATION_V1,
  assertIntegratedPipelineModuleInvariants,
  certifySmartMobileImagePipelineLogicModule,
} from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";

export type {
  IntegrationCertificationScenarioId,
  IntegrationCertificationScenarioResult,
  IntegrationCertificationSuiteResult,
} from "@/lib/media/smart-mobile-image-pipeline/integration-certification-v1";

export {
  assertValidJpegBuffer,
  isUtf8CorruptedJpeg,
  isValidJpegSoi,
} from "@/lib/media/smart-mobile-image-pipeline/jpeg-guards-v1";
