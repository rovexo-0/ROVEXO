import type { SecurityEngineModule } from "@/lib/security-engine/types";

export const SECURITY_ENGINE_MODULES: SecurityEngineModule[] = [
  { id: "authentication", label: "Authentication Center", icon: "🔑", description: "Login, MFA, and passkeys", href: "/account/security" },
  { id: "authorization", label: "Authorization Center", icon: "🛡️", description: "RBAC and permission matrix", href: "/security?tab=authorization" },
  { id: "sessions", label: "Session Manager", icon: "⏱️", description: "Active sessions and logout", href: "/account/security" },
  { id: "devices", label: "Device Manager", icon: "📱", description: "Registered and trusted devices", href: "/security?tab=devices" },
  { id: "login", label: "Login History", icon: "📋", description: "Successful and failed logins", href: "/security?tab=login" },
  { id: "threat", label: "Threat Center", icon: "⚠️", description: "Fraud and anomaly detection", href: "/security?tab=threat" },
  { id: "compliance", label: "Compliance Center", icon: "📜", description: "GDPR, privacy, and consent", href: "/account/privacy" },
  { id: "audit", label: "Audit Center", icon: "📝", description: "Security and admin audit logs", href: "/super-admin/audit" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order security events", href: "/orders" },
  { id: "payments", label: "Payments Integration", icon: "💳", description: "Payment fraud monitoring", href: "/payments" },
  { id: "wallet", label: "Wallet Integration", icon: "👛", description: "Withdrawal security", href: "/wallet" },
  { id: "protection", label: "Buyer Protection Integration", icon: "🛡️", description: "Dispute and case security", href: "/protection" },
  { id: "messages", label: "Messages Integration", icon: "💬", description: "Conversation moderation", href: "/messages" },
  { id: "notifications", label: "Notifications Integration", icon: "🔔", description: "Security alerts delivery", href: "/notifications" },
  { id: "analytics", label: "Analytics Integration", icon: "📈", description: "Security metrics and reporting", href: "/analytics" },
  { id: "recovery", label: "Recovery Center", icon: "💾", description: "Backup and emergency mode", href: "/super-admin/recovery" },
];

export const SECURITY_ENGINE_MODULE_IDS = [
  { id: "authentication", label: "Authentication Center" },
  { id: "authorization", label: "Authorization Center" },
  { id: "identity", label: "Identity Management" },
  { id: "roles", label: "Role Management" },
  { id: "permissions", label: "Permission Management" },
  { id: "sessions", label: "Session Manager" },
  { id: "devices", label: "Device Manager" },
  { id: "login", label: "Login Manager" },
  { id: "security-center", label: "Security Center" },
  { id: "threat", label: "Threat Center" },
  { id: "compliance", label: "Compliance Center" },
  { id: "audit", label: "Audit Center" },
  { id: "recovery", label: "Recovery Center" },
  { id: "backup", label: "Backup Center" },
] as const;

export const SECURITY_ENGINE_AUTH_METHODS = [
  { id: "email", label: "Email Login" },
  { id: "password", label: "Password Login" },
  { id: "magic-link", label: "Magic Link" },
  { id: "otp", label: "One-Time Code" },
  { id: "2fa", label: "Two-Factor Authentication" },
  { id: "authenticator", label: "Authenticator Apps" },
  { id: "backup-codes", label: "Backup Codes" },
  { id: "passkeys", label: "Passkeys (WebAuthn)" },
  { id: "remember-device", label: "Remember Device" },
  { id: "trusted-device", label: "Trusted Device" },
] as const;

export const SECURITY_ENGINE_ROLES = [
  { id: "guest", label: "Guest" },
  { id: "buyer", label: "Buyer" },
  { id: "seller", label: "Seller" },
  { id: "business", label: "Business" },
  { id: "support", label: "Support" },
  { id: "moderator", label: "Moderator" },
  { id: "administrator", label: "Administrator" },
  { id: "super-administrator", label: "Super Administrator" },
  { id: "developer", label: "Developer" },
  { id: "system", label: "System" },
] as const;

export const SECURITY_ENGINE_ALERT_LEVELS = [
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "information", label: "Information" },
] as const;

export function registerSecurityEngineModule(module: SecurityEngineModule): SecurityEngineModule[] {
  const index = SECURITY_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...SECURITY_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...SECURITY_ENGINE_MODULES, module];
}
