export const MOBILE_CC_ROUTES = [
  { id: "dashboard", label: "Mobile Control Center", href: "/super-admin/mobile" },
  { id: "builds", label: "Build Center", href: "/super-admin/mobile/builds" },
  { id: "downloads", label: "Download Center", href: "/super-admin/mobile/downloads" },
  { id: "ios", label: "iOS Center", href: "/super-admin/mobile/ios" },
  { id: "android", label: "Android Center", href: "/super-admin/mobile/android" },
  { id: "devices", label: "Device Management", href: "/super-admin/mobile/devices" },
  { id: "ota", label: "OTA Update Center", href: "/super-admin/mobile/ota" },
  { id: "push", label: "Push Center", href: "/super-admin/mobile/push" },
] as const;

export const UNIQUE_BUILD_TYPES = [
  "build-android", "build-android-aab", "build-apk", "build-ios", "build-testflight",
  "build-internal", "build-production", "build-hotfix", "build-beta",
] as const;

export const DOWNLOAD_TYPES = [
  "android-apk", "android-aab", "internal-build", "test-build", "qr-code", "release-notes",
] as const;

export const OTA_ROLLOUT_TYPES = [
  "ota-release", "gradual-rollout", "rollback", "emergency-update",
  "staged-rollout", "country-rollout", "device-rollout",
] as const;

export const PUSH_TYPES = [
  "broadcast", "emergency-alert", "silent-push", "update-available",
  "security-alert", "maintenance-alert",
] as const;

export const DEVICE_ACTIONS = [
  "remote-logout", "disable-device", "force-sync", "send-notification", "lock-session",
] as const;

export const MOBILE_CC_API = {
  snapshot: "/api/super-admin/mobile",
  builds: "/api/super-admin/mobile/builds",
  devices: "/api/super-admin/mobile/devices",
  downloads: "/api/super-admin/mobile/downloads",
  releases: "/api/super-admin/mobile/releases",
  build: "/api/super-admin/mobile/build",
  publish: "/api/super-admin/mobile/publish",
  rollback: "/api/super-admin/mobile/rollback",
  sendPush: "/api/super-admin/mobile/send-push",
  createOta: "/api/super-admin/mobile/create-ota",
  remoteLogout: "/api/super-admin/mobile/remote-logout",
  disableDevice: "/api/super-admin/mobile/disable-device",
  v1Snapshot: "/api/v1/super-admin/mobile",
} as const;

export const MOBILE_AI_MONITOR_TYPES = [
  "crash-trends", "device-health", "release-risks", "version-adoption",
  "build-quality", "push-success", "battery-consumption", "startup-performance",
] as const;

export const MOBILE_AI_SUGGESTION_TYPES = [
  "release-recommendation", "rollback-recommendation", "device-optimisation",
  "update-schedule",
] as const;
