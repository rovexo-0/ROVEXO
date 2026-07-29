/**
 * ROVEXO Smart Mobile Image Pipeline — SSOT Consolidation v1.0
 *
 * PHASE VII · COD SÂNGE · Logic only
 *
 * Architecture verification only.
 * NO new functionality · NO optimisation · NO behavioural / API / UI changes.
 */

export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_CONSOLIDATION_V1 = {
  version: "1.0",
  id: "smart-mobile-image-pipeline-ssot-consolidation-v1",
  phase: "VII_SSOT_CONSOLIDATION",
  status: "CERTIFIED",
  scope: "LOGIC_LAYER_ONLY",
  behaviouralChangesForbidden: true,
  publicApiChangesForbidden: true,
  optimisationForbidden: true,
  featureAdditionsForbidden: true,
  uiForbidden: true,
  cameraForbidden: true,
  networkForbidden: true,
  storageForbidden: true,
  uploadForbidden: true,
  pixelDecodeForbidden: true,
  compressionForbidden: true,
  certifiedPhases: [
    "I_PIPELINE_ENGINE",
    "II_VALIDATION_ENGINE",
    "III_NORMALIZATION_ENGINE",
    "IV_METADATA_ENGINE",
    "V_PIPELINE_INTEGRATION",
    "VI_PERFORMANCE_VALIDATION",
    "VII_SSOT_CONSOLIDATION",
  ] as const,
} as const;

/**
 * Canonical domain owners — exactly one owner per domain.
 *
 * Phase I Pipeline Engine retains lifecycle + certified inline validate/normalize
 * paths as LIFECYCLE_COMPAT only. Canonical Validation / Normalization / Metadata
 * ownership remains with Phase II / III / IV engines.
 */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS = {
  pipelineLifecycle: "SmartMobileImagePipelineEngine",
  pipelineOrchestration: "SmartMobileImagePipelineEngine",
  pipelineState: "SmartMobileImagePipelineEngine",
  pipelineLifecycleValidateNormalize:
    "SmartMobileImagePipelineEngine (LIFECYCLE_COMPAT)",
  validation: "SmartMobileImageValidationEngine",
  validationRules: "SmartMobileImageValidationEngine",
  validationTaxonomy: "SmartMobileImageValidationEngine",
  normalization: "SmartMobileImageNormalizationEngine",
  normalizationState: "SmartMobileImageNormalizationEngine",
  metadata: "SmartMobileImageMetadataEngine",
  metadataSnapshots: "SmartMobileImageMetadataEngine",
  metadataVersions: "SmartMobileImageMetadataEngine",
  metadataIdentifiers: "SmartMobileImageMetadataEngine",
  metadataFingerprints: "SmartMobileImageMetadataEngine",
  metadataCloneCanonical: "SmartMobileImageMetadataEngine.cloneMetadataRecord",
  compositionState: "SmartMobileImagePipelineComposition",
  jpegGuards: "jpeg-guards-v1 (PURE_HELPER)",
} as const;

/** Exactly one producer per event type string within its engine namespace. */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_PRODUCERS = {
  ImageReceived: "SmartMobileImagePipelineEngine",
  ImageValidated: "SmartMobileImagePipelineEngine",
  ImageNormalized: "SmartMobileImagePipelineEngine",
  PipelineImageRejected: "SmartMobileImagePipelineEngine",
  PipelineReady_PipelineEngine: "SmartMobileImagePipelineEngine",
  PipelineFailed_PipelineEngine: "SmartMobileImagePipelineEngine",
  ValidationStarted: "SmartMobileImageValidationEngine",
  ValidationPassed: "SmartMobileImageValidationEngine",
  ValidationFailed: "SmartMobileImageValidationEngine",
  ValidationImageRejected: "SmartMobileImageValidationEngine",
  PipelineReady_ValidationEngine: "SmartMobileImageValidationEngine",
  PipelineFailed_ValidationEngine: "SmartMobileImageValidationEngine",
  NormalizationStarted: "SmartMobileImageNormalizationEngine",
  NormalizationCompleted: "SmartMobileImageNormalizationEngine",
  NormalizationFailed: "SmartMobileImageNormalizationEngine",
  MetadataCreated: "SmartMobileImageMetadataEngine",
  MetadataUpdated: "SmartMobileImageMetadataEngine",
  MetadataFrozen: "SmartMobileImageMetadataEngine",
  MetadataCompared: "SmartMobileImageMetadataEngine",
  MetadataSnapshotCreated: "SmartMobileImageMetadataEngine",
  MetadataFailed: "SmartMobileImageMetadataEngine",
  IntegrationReceived: "SmartMobileImagePipelineComposition",
  IntegrationValidating: "SmartMobileImagePipelineComposition",
  IntegrationNormalizing: "SmartMobileImagePipelineComposition",
  IntegrationMetadataReady: "SmartMobileImagePipelineComposition",
  IntegrationPipelineReady: "SmartMobileImagePipelineComposition",
  IntegrationRejected: "SmartMobileImagePipelineComposition",
  IntegrationFailed: "SmartMobileImagePipelineComposition",
} as const;

/**
 * Wire event discriminant collisions (same `type` string, different engines).
 * Consumers MUST discriminate by producer engine — never by `type` alone.
 */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_TYPE_COLLISIONS = [
  {
    type: "ImageRejected",
    producers: [
      "SmartMobileImagePipelineEngine",
      "SmartMobileImageValidationEngine",
    ] as const,
    canonicalConsumerDomain: "validation",
  },
  {
    type: "PipelineReady",
    producers: [
      "SmartMobileImagePipelineEngine",
      "SmartMobileImageValidationEngine",
    ] as const,
    canonicalConsumerDomain: "pipelineLifecycle",
  },
  {
    type: "PipelineFailed",
    producers: [
      "SmartMobileImagePipelineEngine",
      "SmartMobileImageValidationEngine",
    ] as const,
    canonicalConsumerDomain: "pipelineLifecycle",
  },
] as const;

/** Import DAG — no cycles. Value deps only flow toward types / factories / composition. */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG = {
  "jpeg-guards-v1": [],
  "pipeline-types-v1": [],
  "validation-types-v1": ["pipeline-types-v1"],
  "normalization-types-v1": ["pipeline-types-v1"],
  "metadata-types-v1": ["pipeline-types-v1"],
  "pipeline-integration-types-v1": [
    "pipeline-types-v1",
    "validation-types-v1",
    "normalization-types-v1",
    "metadata-types-v1",
  ],
  "pipeline-engine-v1": ["pipeline-types-v1", "jpeg-guards-v1"],
  "validation-engine-v1": [
    "validation-types-v1",
    "pipeline-types-v1",
    "jpeg-guards-v1",
  ],
  "normalization-engine-v1": ["normalization-types-v1", "pipeline-types-v1"],
  "metadata-engine-v1": ["metadata-types-v1", "pipeline-types-v1"],
  "pipeline-integration-v1": [
    "pipeline-integration-types-v1",
    "pipeline-engine-v1",
    "validation-engine-v1",
    "normalization-engine-v1",
    "metadata-engine-v1",
  ],
  "performance-validation-v1": [
    "validation-engine-v1",
    "normalization-engine-v1",
    "metadata-engine-v1",
    "pipeline-integration-v1",
    "validation-types-v1",
    "normalization-types-v1",
    "metadata-types-v1",
    "pipeline-integration-types-v1",
  ],
  "ssot-consolidation-v1": [],
  "integration-certification-v1": [
    "pipeline-engine-v1",
    "validation-engine-v1",
    "validation-types-v1",
    "normalization-engine-v1",
    "metadata-engine-v1",
    "pipeline-integration-v1",
    "pipeline-integration-types-v1",
    "performance-validation-v1",
    "ssot-consolidation-v1",
  ],
  index: [
    "pipeline-engine-v1",
    "pipeline-types-v1",
    "validation-engine-v1",
    "validation-types-v1",
    "normalization-engine-v1",
    "normalization-types-v1",
    "metadata-engine-v1",
    "metadata-types-v1",
    "pipeline-integration-v1",
    "pipeline-integration-types-v1",
    "performance-validation-v1",
    "ssot-consolidation-v1",
    "integration-certification-v1",
    "jpeg-guards-v1",
  ],
} as const;

/** Explicit one-way composition contracts. */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS = [
  "Pipeline → Validation",
  "Validation → Normalization",
  "Normalization → Metadata",
  "Metadata → Pipeline Ready",
] as const;

/** Canonical state machines per owner (documentation matrix). */
export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_STATE_MATRIX = {
  SmartMobileImagePipelineEngine: [
    "EMPTY",
    "RECEIVED",
    "VALIDATING",
    "NORMALIZING",
    "READY",
    "FAILED",
    "REJECTED",
  ],
  SmartMobileImageValidationEngine: [
    "RECEIVED",
    "VALIDATING",
    "VALID",
    "READY",
    "INVALID",
    "REJECTED",
    "FAILED",
  ],
  SmartMobileImageNormalizationEngine: [
    "NOT_NORMALIZED",
    "NORMALIZING",
    "NORMALIZED",
    "FAILED",
  ],
  SmartMobileImageMetadataEngine: [
    "EMPTY",
    "CREATED",
    "ACTIVE",
    "FROZEN",
    "FAILED",
  ],
  SmartMobileImagePipelineComposition: [
    "RECEIVED",
    "VALIDATING",
    "NORMALIZING",
    "METADATA_READY",
    "PIPELINE_READY",
    "REJECTED",
    "FAILED",
  ],
} as const;

export const SMART_MOBILE_IMAGE_PIPELINE_SSOT_INVARIANTS = [
  "EXACTLY_ONE_PIPELINE_ENGINE",
  "EXACTLY_ONE_VALIDATION_ENGINE",
  "EXACTLY_ONE_NORMALIZATION_ENGINE",
  "EXACTLY_ONE_METADATA_ENGINE",
  "EXACTLY_ONE_PIPELINE_COMPOSITION",
] as const;

export type SmartMobileImagePipelineSsotOwnerDomain =
  keyof typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS;

export type SmartMobileImagePipelineSsotIssueCode =
  | "DUPLICATE_DOMAIN"
  | "DUPLICATE_CANONICAL_OWNER_CONFLICT"
  | "CIRCULAR_IMPORT"
  | "REVERSE_OWNERSHIP"
  | "MISSING_COMPOSITION_CONTRACT"
  | "INVARIANT_VIOLATION"
  | "EVENT_COLLISION_UNDOCUMENTED";

export type SmartMobileImagePipelineSsotIssue = {
  code: SmartMobileImagePipelineSsotIssueCode;
  message: string;
};

export type SmartMobileImagePipelineSsotResult =
  | { ok: true; issues: readonly [] }
  | { ok: false; issues: readonly SmartMobileImagePipelineSsotIssue[] };

export type SmartMobileImagePipelineSsotReport = {
  ownershipMatrix: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS;
  dependencyMatrix: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG;
  compositionMatrix: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS;
  stateMatrix: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_STATE_MATRIX;
  eventMatrix: {
    producers: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_PRODUCERS;
    collisions: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_TYPE_COLLISIONS;
  };
  invariants: typeof SMART_MOBILE_IMAGE_PIPELINE_SSOT_INVARIANTS;
};

/** Canonical engine class names that may own multiple domains. */
const CANONICAL_ENGINE_OWNERS = [
  "SmartMobileImagePipelineEngine",
  "SmartMobileImageValidationEngine",
  "SmartMobileImageNormalizationEngine",
  "SmartMobileImageMetadataEngine",
  "SmartMobileImagePipelineComposition",
] as const;

function isCanonicalEngineOwner(value: string): boolean {
  return (CANONICAL_ENGINE_OWNERS as readonly string[]).includes(value);
}

/** Ownership matrix domain-key uniqueness + no conflicting dual owners for same domain. */
export function assertSsotOwnershipMatrix(): SmartMobileImagePipelineSsotResult {
  const issues: SmartMobileImagePipelineSsotIssue[] = [];
  const domains = Object.keys(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS);
  if (new Set(domains).size !== domains.length) {
    issues.push({
      code: "DUPLICATE_DOMAIN",
      message: "Ownership matrix contains duplicate domain keys.",
    });
  }

  const required = [
    "pipelineLifecycle",
    "validation",
    "normalization",
    "metadata",
    "compositionState",
  ] as const;
  for (const domain of required) {
    const owner = SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS[domain];
    if (!owner || typeof owner !== "string") {
      issues.push({
        code: "INVARIANT_VIOLATION",
        message: `Missing required ownership domain: ${domain}`,
      });
    }
  }

  if (
    SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.validation !==
      "SmartMobileImageValidationEngine" ||
    SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.normalization !==
      "SmartMobileImageNormalizationEngine" ||
    SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS.metadata !==
      "SmartMobileImageMetadataEngine"
  ) {
    issues.push({
      code: "DUPLICATE_CANONICAL_OWNER_CONFLICT",
      message: "Canonical Validation/Normalization/Metadata owners are not singular.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/** Detect cycles in the declared import DAG. */
export function detectSsotImportCycles(): SmartMobileImagePipelineSsotResult {
  const graph = SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG;
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const issues: SmartMobileImagePipelineSsotIssue[] = [];

  function visit(node: string, stack: string[]): void {
    if (visiting.has(node)) {
      issues.push({
        code: "CIRCULAR_IMPORT",
        message: `Circular import: ${[...stack, node].join(" → ")}`,
      });
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    const deps = graph[node as keyof typeof graph] ?? [];
    for (const dep of deps) {
      visit(dep, [...stack, node]);
    }
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of Object.keys(graph)) {
    visit(node, []);
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/**
 * Reverse ownership checks — engines must not depend on composition / performance / ssot.
 */
export function assertSsotDependencyDirection(): SmartMobileImagePipelineSsotResult {
  const issues: SmartMobileImagePipelineSsotIssue[] = [];
  const forbiddenDependents = [
    "pipeline-engine-v1",
    "validation-engine-v1",
    "normalization-engine-v1",
    "metadata-engine-v1",
  ] as const;
  const forbiddenDeps = [
    "pipeline-integration-v1",
    "performance-validation-v1",
    "ssot-consolidation-v1",
    "index",
  ] as const;

  for (const node of forbiddenDependents) {
    const deps = SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG[node];
    for (const dep of deps) {
      if ((forbiddenDeps as readonly string[]).includes(dep)) {
        issues.push({
          code: "REVERSE_OWNERSHIP",
          message: `${node} must not import ${dep}`,
        });
      }
    }
  }

  const contracts = SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS;
  if (contracts.length !== 4) {
    issues.push({
      code: "MISSING_COMPOSITION_CONTRACT",
      message: "Composition matrix must declare exactly four one-way contracts.",
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

export function assertSsotInvariants(): SmartMobileImagePipelineSsotResult {
  const issues: SmartMobileImagePipelineSsotIssue[] = [];
  if (SMART_MOBILE_IMAGE_PIPELINE_SSOT_INVARIANTS.length !== 5) {
    issues.push({
      code: "INVARIANT_VIOLATION",
      message: "Expected exactly five singularity invariants.",
    });
  }
  const engines = new Set(
    Object.values(SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS).filter(isCanonicalEngineOwner),
  );
  for (const required of CANONICAL_ENGINE_OWNERS) {
    if (!engines.has(required)) {
      issues.push({
        code: "INVARIANT_VIOLATION",
        message: `Missing singularity owner class: ${required}`,
      });
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

export function assertSsotEventCollisionsDocumented(): SmartMobileImagePipelineSsotResult {
  const required = ["ImageRejected", "PipelineReady", "PipelineFailed"] as const;
  const documented = new Set(
    SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_TYPE_COLLISIONS.map((entry) => entry.type),
  );
  const issues: SmartMobileImagePipelineSsotIssue[] = [];
  for (const type of required) {
    if (!documented.has(type)) {
      issues.push({
        code: "EVENT_COLLISION_UNDOCUMENTED",
        message: `Event type collision not documented: ${type}`,
      });
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

/** Full SSOT verification — fail closed. */
export function certifySmartMobileImagePipelineSsot(): SmartMobileImagePipelineSsotResult {
  const issues: SmartMobileImagePipelineSsotIssue[] = [];
  const checks = [
    assertSsotOwnershipMatrix(),
    detectSsotImportCycles(),
    assertSsotDependencyDirection(),
    assertSsotInvariants(),
    assertSsotEventCollisionsDocumented(),
  ];
  for (const check of checks) {
    if (!check.ok) {
      issues.push(...check.issues);
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, issues: [] };
}

export function generateSmartMobileImagePipelineSsotReport(): SmartMobileImagePipelineSsotReport {
  return {
    ownershipMatrix: SMART_MOBILE_IMAGE_PIPELINE_SSOT_OWNERS,
    dependencyMatrix: SMART_MOBILE_IMAGE_PIPELINE_SSOT_IMPORT_DAG,
    compositionMatrix: SMART_MOBILE_IMAGE_PIPELINE_SSOT_COMPOSITION_CONTRACTS,
    stateMatrix: SMART_MOBILE_IMAGE_PIPELINE_SSOT_STATE_MATRIX,
    eventMatrix: {
      producers: SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_PRODUCERS,
      collisions: SMART_MOBILE_IMAGE_PIPELINE_SSOT_EVENT_TYPE_COLLISIONS,
    },
    invariants: SMART_MOBILE_IMAGE_PIPELINE_SSOT_INVARIANTS,
  };
}

export function assertSsotOwnershipSingularity(): void {
  const result = certifySmartMobileImagePipelineSsot();
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join("; "));
  }
}
