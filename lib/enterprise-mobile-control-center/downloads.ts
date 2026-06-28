import type { DownloadType, MobileDownload } from "@/lib/enterprise-mobile-control-center/types";
import { DOWNLOAD_TYPES } from "@/lib/enterprise-mobile-control-center/registry";

export function isValidDownloadType(type: string): type is DownloadType {
  return (DOWNLOAD_TYPES as readonly string[]).includes(type);
}

export function generateDownload(type: DownloadType, version = "2.4.0"): MobileDownload {
  const platform = type.includes("ios") ? "ios" : "android";
  return {
    id: `dl-${type}-${Date.now()}`,
    type,
    platform,
    version,
    url: `https://releases.rovexo.app/${platform}/${version}/${type}`,
    qrCode: type === "qr-code" ? `https://releases.rovexo.app/qr/${version}` : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function generateReleaseNotes(version: string): string {
  return `Release ${version}\n- Enterprise mobile improvements\n- Security patches\n- Performance optimisations`;
}

export function listDownloadTypes(): DownloadType[] {
  return [...DOWNLOAD_TYPES];
}
