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

/** Service Worker cache epoch — bump on every Production web/PWA release. */
export const ROVEXO_SW_CACHE_EPOCH = "17";

/** Service Worker static cache name (must match public/sw.js). */
export const ROVEXO_SW_CACHE_NAME = `rovexo-static-v${ROVEXO_SW_CACHE_EPOCH}`;

/** Service Worker runtime cache (documents are never stored here). */
export const ROVEXO_SW_RUNTIME_CACHE_NAME = `rovexo-runtime-v${ROVEXO_SW_CACHE_EPOCH}`;

/** Service Worker image cache (icons / category art — stale-while-revalidate). */
export const ROVEXO_SW_IMAGES_CACHE_NAME = `rovexo-images-v${ROVEXO_SW_CACHE_EPOCH}`;

/** Android versionName — same release identity as web/PWA. */
export const ROVEXO_ANDROID_VERSION_NAME = ROVEXO_APP_VERSION;

/** Android versionCode — monotonic integer required by the platform. */
export const ROVEXO_ANDROID_VERSION_CODE = 17;

/** Post-RC1 workstream — not part of this freeze */
export const ROVEXO_NEXT_MINOR = "v1.1";

export const ROVEXO_RELEASE_META = {
  version: ROVEXO_APP_VERSION,
  label: ROVEXO_RELEASE_LABEL,
  code: ROVEXO_RELEASE_CODE,
  swCacheEpoch: ROVEXO_SW_CACHE_EPOCH,
  swCacheName: ROVEXO_SW_CACHE_NAME,
  swRuntimeCacheName: ROVEXO_SW_RUNTIME_CACHE_NAME,
  swImagesCacheName: ROVEXO_SW_IMAGES_CACHE_NAME,
  androidVersionName: ROVEXO_ANDROID_VERSION_NAME,
  androidVersionCode: ROVEXO_ANDROID_VERSION_CODE,
  nextMinor: ROVEXO_NEXT_MINOR,
  status: "RELEASE_CANDIDATE",
  productionLock: false,
  githubPushAuthorized: false,
  vercelProductionDeployAuthorized: false,
} as const;
