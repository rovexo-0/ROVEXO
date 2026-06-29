export const MOBILE_DISTRIBUTION_LANGUAGES = [
  { id: "en" as const, label: "English", flag: "🇬🇧", ready: true },
  { id: "ro" as const, label: "Romanian", flag: "🇷🇴", ready: true },
] as const;

export const MOBILE_FUTURE_LANGUAGES = ["French", "German", "Spanish", "Italian"] as const;

export const MOBILE_DOWNLOAD_CARDS = [
  { id: "ios", label: "Download iPhone", icon: "📱", hrefKey: "ios" as const },
  { id: "android", label: "Download Android", icon: "🤖", hrefKey: "android" as const },
  { id: "latest", label: "Download Latest Version", icon: "⬇", hrefKey: "latest" as const },
  { id: "release-notes", label: "Release Notes", icon: "📜", hrefKey: "releaseNotes" as const },
  { id: "installation-guide", label: "Installation Guide", icon: "📖", hrefKey: "installationGuide" as const },
  { id: "previous-versions", label: "Previous Versions", icon: "📦", hrefKey: "previousVersions" as const },
] as const;

export const MOBILE_BIOMETRIC_ACTIONS = [
  { id: "emergency", label: "Emergency Mode", key: "requireForEmergency" as const },
  { id: "release", label: "Release", key: "requireForRelease" as const },
  { id: "user-delete", label: "User Delete", key: "requireForUserDelete" as const },
  { id: "permissions", label: "Permissions", key: "requireForPermissions" as const },
  { id: "certification", label: "Certification", key: "requireForCertification" as const },
  { id: "omega", label: "OMEGA Controls", key: "requireForOmegaControls" as const },
] as const;

export const MOBILE_SECURITY_CENTER_ITEMS = [
  { id: "encryption", label: "Encryption" },
  { id: "digital-signature", label: "Digital Signature" },
  { id: "package-integrity", label: "Package Integrity" },
  { id: "certificate-status", label: "Certificate Status" },
  { id: "trusted-device", label: "Trusted Device" },
  { id: "risk-score", label: "Risk Score" },
  { id: "guardian", label: "Guardian Status" },
  { id: "sentinel", label: "Sentinel Status" },
  { id: "antivirus", label: "Antivirus Status" },
  { id: "omega", label: "OMEGA Status" },
] as const;

export const MOBILE_COMPLIANCE_ITEMS = [
  { id: "rovexo-trust", label: "ROVEXO TRUST", key: "rovexoTrust" as const },
  { id: "omega-gold", label: "OMEGA GOLD", key: "omegaGold" as const },
  { id: "guardian", label: "Guardian", key: "guardian" as const },
  { id: "sentinel", label: "Sentinel", key: "sentinel" as const },
  { id: "antivirus", label: "Antivirus", key: "antivirus" as const },
  { id: "enterprise", label: "Enterprise Compliance", key: "enterpriseCompliance" as const },
] as const;

export const MOBILE_COMPLIANCE_STANDARDS = [
  { id: "iso", label: "ISO Readiness", key: "isoReadiness" as const },
  { id: "cyber", label: "Cyber Essentials", key: "cyberEssentials" as const },
  { id: "soc2", label: "SOC2 Readiness", key: "soc2Readiness" as const },
  { id: "pci", label: "PCI Readiness", key: "pciReadiness" as const },
  { id: "gdpr", label: "GDPR", key: "gdpr" as const },
] as const;

export const MOBILE_NOTIFICATION_TYPES = [
  { id: "new-version", label: "New Version" },
  { id: "critical-update", label: "Critical Update" },
  { id: "security-alert", label: "Security Alert" },
  { id: "expired-device", label: "Expired Device" },
  { id: "certificate-expired", label: "Certificate Expired" },
  { id: "update-required", label: "Update Required" },
] as const;

export const MOBILE_LIVE_STATUS_LEGEND = [
  { id: "installed", label: "Installed", color: "green" },
  { id: "latest-version", label: "Latest Version", color: "blue" },
  { id: "update-available", label: "Update Available", color: "yellow" },
  { id: "compromised", label: "Compromised", color: "red" },
  { id: "offline", label: "Offline", color: "gray" },
] as const;

export const MOBILE_INSTALL_STATUS_LABELS = [
  { id: "already-installed", label: "Already Installed" },
  { id: "latest-version", label: "Latest Version" },
  { id: "outdated", label: "Outdated" },
  { id: "update-available", label: "Update Available" },
  { id: "installation-pending", label: "Installation Pending" },
  { id: "verification-pending", label: "Verification Pending" },
] as const;

export const MOBILE_OMEGA_METRICS = [
  { id: "downloads", label: "Downloads" },
  { id: "updates", label: "Updates" },
  { id: "installations", label: "Installations" },
  { id: "devices", label: "Devices" },
  { id: "crashes", label: "Crashes" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
  { id: "integrity", label: "Integrity" },
  { id: "certificates", label: "Certificates" },
  { id: "version-distribution", label: "Version Distribution" },
] as const;

export const MOBILE_ORI_CATEGORIES = [
  { id: "installation", label: "Installation problems" },
  { id: "compatibility", label: "Compatibility" },
  { id: "device-health", label: "Device Health" },
  { id: "security", label: "Security" },
  { id: "updates", label: "Updates" },
  { id: "recommendations", label: "Recommendations" },
] as const;

export const MOBILE_EXPORT_FORMATS = ["pdf", "csv", "json", "markdown"] as const;

export const MOBILE_DEVICE_ACTIONS = ["remove", "rename", "remote-logout", "block", "trust"] as const;

export const MOBILE_VERIFICATION_CHECKS = [
  "typecheck",
  "unit-tests",
  "integration-tests",
  "security-tests",
  "performance-tests",
  "responsive-tests",
  "accessibility-tests",
  "installation-tests",
  "qr-validation",
  "signature-validation",
  "biometric-validation",
  "production-build",
] as const;
