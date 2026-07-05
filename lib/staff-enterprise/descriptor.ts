import { versionedApiPath } from "@/lib/enterprise-architecture/constants";
import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";

const API_BASE = "/api/staff-enterprise";

export const STAFF_ENTERPRISE_MODULE_DESCRIPTOR: EnterpriseModuleDescriptor = {
  id: "staff-enterprise",
  label: "Staff Enterprise Platform",
  icon: "🪪",
  description:
    "Canonical staff platform — Android, iOS, Windows, Web. Directory, messaging, presence, RBAC, audit.",
  category: "platform",
  version: "1.0.0",
  autoRegister: true,
  baseHref: "/staff",
  routes: [
    { id: "dashboard", href: "/staff", label: "Staff Dashboard" },
    { id: "directory", href: "/staff/directory", label: "Company Directory" },
    { id: "messages", href: "/staff/messages", label: "Internal Messages" },
    { id: "calls", href: "/staff/calls", label: "Voice & Video" },
    { id: "administration", href: "/super-admin/staff", label: "Staff Administration" },
  ],
  api: {
    snapshot: `${API_BASE}`,
    action: `${API_BASE}/action`,
    messages: `${API_BASE}/messages`,
    calls: `${API_BASE}/calls`,
    files: `${API_BASE}/files`,
    offline: `${API_BASE}/offline`,
    push: `${API_BASE}/push`,
    v1Snapshot: versionedApiPath(API_BASE),
    v1Action: `${versionedApiPath(API_BASE)}/action`,
  },
  featureFlags: [
    {
      id: "staff_enterprise_enabled",
      label: "Staff Enterprise Platform",
      description: "Master staff platform toggle",
      defaultEnabled: true,
    },
    {
      id: "staff_internal_chat_enabled",
      label: "Internal Chat",
      description: "Staff messaging channels",
      defaultEnabled: true,
    },
    {
      id: "staff_voice_enabled",
      label: "Voice Calls",
      description: "Internal VoIP with WebRTC signaling",
      defaultEnabled: true,
    },
    {
      id: "staff_video_enabled",
      label: "Video Calls",
      description: "Group meetings, screen share, and recording",
      defaultEnabled: true,
    },
  ],
  permissions: [
    { action: "view-directory", label: "View staff directory", roles: ["super-admin"] },
    { action: "send-message", label: "Send internal messages", roles: ["super-admin"] },
    { action: "manage-staff", label: "Manage staff profiles", roles: ["super-admin"] },
    { action: "assign-roles", label: "Assign staff roles", roles: ["super-admin"] },
    { action: "view-audit", label: "View staff audit logs", roles: ["super-admin"] },
    { action: "register-device", label: "Register staff device", roles: ["super-admin"] },
    { action: "force-logout", label: "Force staff logout", roles: ["super-admin"] },
  ],
  configKeys: {
    draft: "staff_enterprise_draft",
    live: "staff_enterprise_live",
    history: "staff_enterprise_history",
    settings: "staff_enterprise_settings",
  },
  relatedModules: [
    "staff-profile",
    "enterprise-mobile-control-center",
    "messages-engine",
    "notifications-engine",
    "enterprise-security-operations-center",
    "audit-compliance-center",
  ],
};
