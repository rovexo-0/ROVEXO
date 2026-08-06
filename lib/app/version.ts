/**
 * ROVEXO application version SSOT.
 * Release Candidate 1 — all surfaces must reference these constants.
 */

/** Semver package / npm version */
export const ROVEXO_APP_VERSION = "1.0.0-rc.1";

/** Marketing / legal label */
export const ROVEXO_RELEASE_LABEL = "ROVEXO v1.0.0 Release Candidate 1";

/** Short code for docs and tags (no git tag until Owner authorizes) */
export const ROVEXO_RELEASE_CODE = "RC1";

/** Service Worker static cache epoch for this release (White Pearl favicon bump) */
export const ROVEXO_SW_CACHE_NAME = "rovexo-static-v16";

/** Post-RC1 workstream — not part of this freeze */
export const ROVEXO_NEXT_MINOR = "v1.1";

export const ROVEXO_RELEASE_META = {
  version: ROVEXO_APP_VERSION,
  label: ROVEXO_RELEASE_LABEL,
  code: ROVEXO_RELEASE_CODE,
  swCacheName: ROVEXO_SW_CACHE_NAME,
  nextMinor: ROVEXO_NEXT_MINOR,
  status: "RELEASE_CANDIDATE",
  productionLock: false,
  githubPushAuthorized: false,
  vercelProductionDeployAuthorized: false,
} as const;
