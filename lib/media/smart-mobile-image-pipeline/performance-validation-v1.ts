/**
 * ROVEXO Smart Mobile Image Pipeline — Performance Validation v1.0
 *
 * PHASE VI · COD SÂNGE · Logic only
 *
 * Documents performance targets and provides pure benchmark helpers.
 * Does not change public contracts · business logic · state machines · events.
 */

import {
  createMetadataRecord,
  createMetadataSnapshot,
  createSmartMobileImageMetadataEngine,
} from "@/lib/media/smart-mobile-image-pipeline/metadata-engine-v1";
import type { CreateMetadataInput } from "@/lib/media/smart-mobile-image-pipeline/metadata-types-v1";
import {
  createSmartMobileImageNormalizationEngine,
  normalizeImageInput,
} from "@/lib/media/smart-mobile-image-pipeline/normalization-engine-v1";
import type { NormalizeImageInput } from "@/lib/media/smart-mobile-image-pipeline/normalization-types-v1";
import { createSmartMobileImagePipelineComposition } from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-v1";
import type { ProcessPipelineImageInput } from "@/lib/media/smart-mobile-image-pipeline/pipeline-integration-types-v1";
import {
  createSmartMobileImageValidationEngine,
  evaluateImageValidation,
} from "@/lib/media/smart-mobile-image-pipeline/validation-engine-v1";
import type { ReceiveValidationImageInput } from "@/lib/media/smart-mobile-image-pipeline/validation-types-v1";

export const SMART_MOBILE_IMAGE_PIPELINE_PERFORMANCE_VALIDATION_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-performance-validation-v1",
  phase: "VI_PERFORMANCE_VALIDATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  publicContractChangesForbidden: true,
  apiChangesForbidden: true,
  uiForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  uploadForbidden: true,
  pixelDecodeForbidden: true,
  compressionForbidden: true,
  targets: [
    "unnecessary_allocations",
    "object_cloning",
    "deep_clone_efficiency",
    "immutable_snapshot_creation",
    "temporary_objects",
    "duplicate_clone_passes",
    "lookup_performance",
    "import_graph",
    "dead_code",
    "duplicate_code",
    "type_narrowing",
    "bundle_size_opportunities",
    "deterministic_execution",
  ] as const,
  engines: [
    "pipeline-engine-v1",
    "validation-engine-v1",
    "normalization-engine-v1",
    "metadata-engine-v1",
    "pipeline-integration-v1",
  ] as const,
  optimizationsApplied: [
    "VALIDATION_COMMIT_SINGLE_IMAGE_CLONE_PASS",
    "PIPELINE_COMMIT_SINGLE_IMAGE_CLONE_PASS",
    "NORMALIZATION_REMOVE_PRECOMMIT_CLONE",
    "METADATA_COMMIT_SINGLE_SNAPSHOT_BUILD",
    "INTEGRATION_REUSE_METADATA_CLONE",
  ] as const,
} as const;

export type PerformanceBenchmarkResult = {
  readonly name: string;
  readonly iterations: number;
  readonly elapsedMs: number;
};

function elapsedMs(start: number, end: number): number {
  return Math.max(0, end - start);
}

const VALIDATION_BENCH_INPUT: ReceiveValidationImageInput = {
  imageId: "perf-v",
  format: "jpeg",
  mimeType: "image/jpeg",
  extension: ".jpg",
  width: 1200,
  height: 1600,
  orientation: 1,
  byteLength: 48_000,
  contentFingerprint: "fp-perf-v",
};

const NORMALIZE_BENCH_INPUT: NormalizeImageInput = {
  imageId: "perf-n",
  format: "jpeg",
  mimeType: "image/jpg",
  extension: ".JPEG",
  width: 100,
  height: 200,
  orientation: 6,
  byteLength: 1024,
  contentFingerprint: "fp-perf-n",
  filename: "folder/My Photo.JPEG",
  timestamp: 1_700_000_000_000,
  at: 1,
};

const METADATA_BENCH_INPUT: CreateMetadataInput = {
  identifier: "perf-m",
  fingerprint: "fp-perf-m",
  width: 800,
  height: 600,
  orientation: 1,
  mimeType: "image/jpeg",
  extension: ".jpg",
  fileName: "photo.jpg",
  fileSize: 2048,
  timestamp: 1_700_000_000_000,
  format: "jpeg",
  at: 1,
};

function compositionBenchInput(index: number): ProcessPipelineImageInput {
  return {
    imageId: `perf-c-${index}`,
    format: "jpeg",
    mimeType: "image/jpeg",
    extension: ".jpg",
    width: 1200,
    height: 1600,
    orientation: 1,
    byteLength: 48_000,
    contentFingerprint: `fp-perf-c-${index}`,
    filename: "photo.jpg",
    timestamp: 1_700_000_000_000,
    at: 100 + index,
    bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]),
  };
}

/** Repeated pure validation — no engine state. */
export function benchmarkRepeatedValidation(
  iterations: number,
): PerformanceBenchmarkResult {
  const context = {
    existingImageIds: [] as string[],
    existingFingerprints: [] as string[],
    currentCount: 0,
  };
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    evaluateImageValidation(VALIDATION_BENCH_INPUT, context);
  }
  return {
    name: "repeated_validation",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Repeated pure normalization — no engine state. */
export function benchmarkRepeatedNormalization(
  iterations: number,
): PerformanceBenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    normalizeImageInput(NORMALIZE_BENCH_INPUT);
  }
  return {
    name: "repeated_normalization",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Repeated metadata create + freeze path via engine reset. */
export function benchmarkRepeatedMetadataCreation(
  iterations: number,
): PerformanceBenchmarkResult {
  const engine = createSmartMobileImageMetadataEngine();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    engine.reset(i);
    engine.create({ ...METADATA_BENCH_INPUT, at: i });
  }
  return {
    name: "repeated_metadata_creation",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Large metadata snapshot collection (create → snapshot × N). */
export function benchmarkLargeMetadataCollections(
  iterations: number,
): PerformanceBenchmarkResult {
  const records = [];
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const record = createMetadataRecord({
      ...METADATA_BENCH_INPUT,
      identifier: `perf-m-${i}`,
      fingerprint: `fp-perf-m-${i}`,
      at: i,
    });
    if (record) {
      records.push(createMetadataSnapshot(record, i));
    }
  }
  void records.length;
  return {
    name: "large_metadata_collections",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Repeated immutable snapshot creation from one frozen record. */
export function benchmarkRepeatedSnapshotCreation(
  iterations: number,
): PerformanceBenchmarkResult {
  const record = createMetadataRecord(METADATA_BENCH_INPUT);
  if (!record) {
    return { name: "repeated_snapshot_creation", iterations: 0, elapsedMs: 0 };
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    createMetadataSnapshot(record, i);
  }
  return {
    name: "repeated_snapshot_creation",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Repeated pipeline composition (fresh composition each iteration). */
export function benchmarkRepeatedPipelineComposition(
  iterations: number,
): PerformanceBenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const composition = createSmartMobileImagePipelineComposition();
    composition.process(compositionBenchInput(i));
  }
  return {
    name: "repeated_pipeline_composition",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Normalization engine load+normalize with reset — allocation path under FSM. */
export function benchmarkNormalizationEngineCycle(
  iterations: number,
): PerformanceBenchmarkResult {
  const engine = createSmartMobileImageNormalizationEngine();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    engine.reset(i);
    engine.load({ ...NORMALIZE_BENCH_INPUT, at: i });
    engine.normalize(i);
  }
  return {
    name: "normalization_engine_cycle",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

/** Validation engine receive+validate with reset. */
export function benchmarkValidationEngineCycle(
  iterations: number,
): PerformanceBenchmarkResult {
  const engine = createSmartMobileImageValidationEngine();
  const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x04]);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    engine.reset(i);
    engine.receiveImage({
      ...VALIDATION_BENCH_INPUT,
      imageId: `perf-v-${i}`,
      contentFingerprint: `fp-perf-v-${i}`,
      bytes,
      at: i,
    });
    engine.validate(i);
  }
  return {
    name: "validation_engine_cycle",
    iterations,
    elapsedMs: elapsedMs(start, performance.now()),
  };
}

export function runSmartMobileImagePipelinePerformanceBenchmarks(
  iterations = 200,
): readonly PerformanceBenchmarkResult[] {
  return [
    benchmarkRepeatedValidation(iterations),
    benchmarkRepeatedNormalization(iterations),
    benchmarkRepeatedMetadataCreation(iterations),
    benchmarkLargeMetadataCollections(iterations),
    benchmarkRepeatedSnapshotCreation(iterations),
    benchmarkNormalizationEngineCycle(iterations),
    benchmarkValidationEngineCycle(iterations),
    benchmarkRepeatedPipelineComposition(Math.min(iterations, 40)),
  ];
}
