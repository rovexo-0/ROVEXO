/**
 * Full recursive public/ asset tree scans are dev/CI-only.
 * Production builds and default runtime validation use library manifests only.
 */
export function isDeepFilesystemAssetScanEnabled(): boolean {
  return process.env.ROVEXO_DEEP_ASSET_SCAN === "1";
}

/** Repo-wide source walks (enterprise scanners). Never enabled during production builds. */
export function isRepoFilesystemScanEnabled(): boolean {
  return process.env.ROVEXO_ALLOW_REPO_SCAN === "1";
}
