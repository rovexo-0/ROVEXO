export const DEVICE_LIFECYCLE_ROUTES = [
  { id: "dashboard", label: "Dashboard", href: "/super-admin/mobile-distribution/devices" },
  { id: "list", label: "Device List", href: "/super-admin/mobile-distribution/devices/list" },
  { id: "device", label: "Device Detail", href: "/super-admin/mobile-distribution/devices/device" },
  { id: "security", label: "Security", href: "/super-admin/mobile-distribution/devices/security" },
  { id: "health", label: "Health", href: "/super-admin/mobile-distribution/devices/health" },
  { id: "trust", label: "Trust Score", href: "/super-admin/mobile-distribution/devices/trust" },
  { id: "logs", label: "Logs", href: "/super-admin/mobile-distribution/devices/logs" },
  { id: "history", label: "History", href: "/super-admin/mobile-distribution/devices/history" },
  { id: "recovery", label: "Recovery", href: "/super-admin/mobile-distribution/devices/recovery" },
  { id: "settings", label: "Settings", href: "/super-admin/mobile-distribution/devices/settings" },
] as const;

export const DEVICE_REMOTE_ACTIONS = [
  { id: "remote-logout", label: "Remote Logout" },
  { id: "remote-lock", label: "Remote Lock" },
  { id: "force-update", label: "Force Update" },
  { id: "revoke", label: "Revoke Device" },
  { id: "remove", label: "Remove Device" },
  { id: "rename", label: "Rename Device" },
  { id: "clear-cache", label: "Clear App Cache" },
  { id: "reset-biometric", label: "Reset Biometric Login" },
  { id: "invalidate-sessions", label: "Invalidate Sessions" },
  { id: "generate-report", label: "Generate Device Report" },
  { id: "trust", label: "Trust Device" },
] as const;

export const DEVICE_BIOMETRIC_REQUIREMENTS = [
  { id: "emergency", label: "Emergency Mode", key: "requireBiometricForEmergency" as const },
  { id: "release", label: "Release Approval", key: "requireBiometricForRelease" as const },
  { id: "role", label: "Role Changes", key: "requireBiometricForRoleChange" as const },
  { id: "delete", label: "User Deletion", key: "requireBiometricForUserDelete" as const },
  { id: "security", label: "Security Settings", key: "requireBiometricForSecuritySettings" as const },
  { id: "certification", label: "Certification Approval", key: "requireBiometricForCertification" as const },
] as const;

export const DEVICE_AUTH_METHODS = [
  "Face ID",
  "Touch ID",
  "Android Biometrics",
  "MFA",
  "Trusted Device",
  "Session Verification",
] as const;

export const DEVICE_TAMPER_CHECKS = [
  { id: "root", label: "Root" },
  { id: "jailbreak", label: "Jailbreak" },
  { id: "modifiedOs", label: "Modified OS" },
  { id: "debugMode", label: "Debug Mode" },
  { id: "emulator", label: "Emulator" },
  { id: "fakeGps", label: "Fake GPS" },
  { id: "hookingFrameworks", label: "Hooking Frameworks" },
  { id: "tamperedApp", label: "Tampered App" },
] as const;

export const DEVICE_ALERT_TYPES = [
  "unknown-device",
  "root-detected",
  "jailbreak-detected",
  "biometric-failure",
  "certificate-expired",
  "app-outdated",
  "high-risk-login",
  "device-offline",
  "tamper-detected",
] as const;

export const DEVICE_CERTIFICATION_BADGES = [
  { id: "omega", label: "OMEGA VERIFIED", key: "omegaVerified" as const },
  { id: "guardian", label: "Guardian VERIFIED", key: "guardianVerified" as const },
  { id: "sentinel", label: "Sentinel VERIFIED", key: "sentinelVerified" as const },
  { id: "antivirus", label: "Antivirus VERIFIED", key: "antivirusVerified" as const },
  { id: "trust", label: "Trust VERIFIED", key: "trustVerified" as const },
] as const;

export const DEVICE_HISTORY_CATEGORIES = [
  "login",
  "location",
  "change",
  "version",
  "security",
  "authentication",
  "update",
] as const;

export const DEVICE_OMEGA_MONITORING = [
  "Device Health",
  "Trust Score",
  "Security",
  "Authentication",
  "Certificates",
  "Performance",
  "Synchronization",
  "Compliance",
] as const;
