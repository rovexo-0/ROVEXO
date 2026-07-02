import type { BuildType, MobileBuild } from "@/lib/enterprise-mobile-control-center/types";
import { UNIQUE_BUILD_TYPES } from "@/lib/enterprise-mobile-control-center/registry";

const PLATFORM_MAP: Record<BuildType, "android" | "ios"> = {
  "build-android": "android",
  "build-android-aab": "android",
  "build-apk": "android",
  "build-ios": "ios",
  "build-testflight": "ios",
  "build-internal": "android",
  "build-production": "android",
  "build-hotfix": "android",
  "build-beta": "android",
};

export function isValidBuildType(type: string): type is BuildType {
  return (UNIQUE_BUILD_TYPES as readonly string[]).includes(type);
}

export function getBuildPlatform(type: BuildType): "android" | "ios" {
  return PLATFORM_MAP[type];
}

export function isAndroidBuild(type: BuildType): boolean {
  return getBuildPlatform(type) === "android";
}

export function isIosBuild(type: BuildType): boolean {
  return getBuildPlatform(type) === "ios";
}

export function createBuild(type: BuildType, version = "2.4.0"): MobileBuild {
  const now = new Date().toISOString();
  return {
    id: `build-${Date.now()}`,
    type,
    platform: getBuildPlatform(type),
    version,
    buildNumber: Math.floor(Date.now() / 1000) % 100000,
    status: "completed",
    createdAt: now,
    completedAt: now,
  };
}

export function listAndroidBuildTypes(): BuildType[] {
  return UNIQUE_BUILD_TYPES.filter(isAndroidBuild);
}

export function listIosBuildTypes(): BuildType[] {
  return UNIQUE_BUILD_TYPES.filter(isIosBuild);
}

export function filterBuildsByPlatform(builds: MobileBuild[], platform: "android" | "ios"): MobileBuild[] {
  return builds.filter((b) => b.platform === platform);
}

export function countQueuedBuilds(builds: MobileBuild[]): number {
  return builds.filter((b) => b.status === "queued" || b.status === "building").length;
}
