/** Current enterprise API version — all new modules expose versioned routes under this prefix. */
export const ENTERPRISE_API_VERSION = "v1";

export function versionedApiPath(basePath: string): string {
  return `/api/${ENTERPRISE_API_VERSION}${basePath}`;
}
