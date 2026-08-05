/**
 * ROVEXO Brand Integrity Runtime — thin facade over Source Integrity Runtime v1.0
 *
 * All brand / source soft-fail behaviour lives in:
 *   `@/lib/startup/source-integrity-runtime-v1`
 *
 * Kept for backward-compatible imports from Blood Laws XXXVII–XLI / XLII.
 */

import { SOURCE_INTEGRITY_RUNTIME_V1 } from "@/lib/startup/source-integrity-runtime-v1";

export const BRAND_INTEGRITY_RUNTIME_V1 = {
  version: "1.0",
  id: "brand-integrity-runtime-v1",
  policy: "warn-and-continue-on-serverless-source-prune",
  delegatesTo: SOURCE_INTEGRITY_RUNTIME_V1.id,
} as const;

export {
  SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
  isSourceTreeCertificationFailure,
  isSourceTreeEnoentError,
  isSourceTreePath,
  isSourceTreeAvailable,
  readSourceUtf8,
  readUtf8SourceOrEmpty,
  shouldSkipSourceTreeVerificationAtRuntime,
  shouldSoftFailBrandIntegrityAtRuntime,
  skipSourceTreeBloodLawIfUnavailable,
  warnBrandIntegrityAndContinue,
  warnSourceIntegrityServerlessOnce,
} from "@/lib/startup/source-integrity-runtime-v1";
