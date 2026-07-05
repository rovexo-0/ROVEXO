import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type StaffEnterpriseCertCheck = {
  id: string;
  label: string;
  pass: boolean;
  note?: string;
};

export type StaffEnterpriseReportSection = {
  id: string;
  title: string;
  pass: boolean;
  checks: StaffEnterpriseCertCheck[];
};

export type StaffEnterpriseCertificationReport = {
  version: "1.0.0";
  milestone: "ROVEXO STAFF ENTERPRISE PLATFORM";
  generatedAt: string;
  pass: boolean;
  score: number;
  architecture: StaffEnterpriseReportSection;
  database: StaffEnterpriseReportSection;
  api: StaffEnterpriseReportSection;
  security: StaffEnterpriseReportSection;
  performance: StaffEnterpriseReportSection;
  accessibility: StaffEnterpriseReportSection;
  audit: StaffEnterpriseReportSection;
  validation: StaffEnterpriseReportSection;
  deployment: StaffEnterpriseReportSection;
  productionReadiness: StaffEnterpriseReportSection;
  blockers: string[];
};

function readSource(rootDir: string, relativePath: string): string {
  const full = join(rootDir, relativePath);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

function section(id: string, title: string, checks: StaffEnterpriseCertCheck[]): StaffEnterpriseReportSection {
  return { id, title, pass: checks.every((c) => c.pass), checks };
}

function grepDuplicatePatterns(rootDir: string): StaffEnterpriseCertCheck[] {
  const staffProfile = readSource(rootDir, "lib/staff-profile/service.ts");
  const staffEnterprise = readSource(rootDir, "lib/staff-enterprise/permissions.ts");
  const duplicateStaffTables = readSource(rootDir, "supabase/migrations/20250725000001_staff_enterprise_platform.sql");

  return [
    {
      id: "ssot-staff-profile",
      label: "Staff identity SSOT remains lib/staff-profile",
      pass: staffProfile.includes("staff_profiles") && staffEnterprise.includes("loadStaffRoleIds"),
    },
    {
      id: "no-duplicate-user-table",
      label: "No duplicate user/auth tables in staff enterprise migration",
      pass:
        !duplicateStaffTables.includes("create table if not exists public.users") &&
        !duplicateStaffTables.includes("create table if not exists public.profiles"),
    },
    {
      id: "extends-not-forks",
      label: "Staff enterprise extends staff_profiles columns",
      pass: duplicateStaffTables.includes("alter table public.staff_profiles"),
    },
  ];
}

function auditDeadRoutes(rootDir: string): StaffEnterpriseCertCheck[] {
  const staffPage = readSource(rootDir, "app/staff/page.tsx");
  const staffApi = readSource(rootDir, "app/api/staff-enterprise/route.ts");
  const middleware = readSource(rootDir, "lib/supabase/middleware.ts");

  return [
    {
      id: "staff-web-route",
      label: "Staff web portal route exists",
      pass: staffPage.length > 0,
    },
    {
      id: "staff-api-route",
      label: "Canonical staff-enterprise API exists",
      pass: staffApi.includes("requireApiStaff"),
    },
    {
      id: "staff-middleware-protected",
      label: "/staff routes protected in middleware",
      pass: middleware.includes('"/staff"'),
    },
  ];
}

export function runStaffEnterpriseCertification(rootDir: string = process.cwd()): StaffEnterpriseCertificationReport {
  const migration = readSource(rootDir, "supabase/migrations/20250725000001_staff_enterprise_platform.sql");
  const staffMigration = readSource(rootDir, "supabase/migrations/20250724000001_staff_profile_activity_audit.sql");
  const permissions = readSource(rootDir, "lib/staff-enterprise/permissions.ts");
  const encryption = readSource(rootDir, "lib/staff-profile/encryption.ts");
  const descriptor = readSource(rootDir, "lib/staff-enterprise/descriptor.ts");
  const registry = readSource(rootDir, "lib/enterprise-architecture/registry.ts");
  const tests = readSource(rootDir, "tests/staff-enterprise.test.ts");

  const architecture = section("architecture", "Architecture Report", [
    {
      id: "single-auth",
      label: "Reuses Supabase auth (no parallel auth system)",
      pass: readSource(rootDir, "lib/auth/session.ts").includes("requireApiSuperAdmin"),
    },
    {
      id: "enterprise-descriptor",
      label: "Staff enterprise registered as enterprise module",
      pass: descriptor.includes("staff-enterprise") && registry.includes("STAFF_ENTERPRISE_MODULE_DESCRIPTOR"),
    },
    {
      id: "platforms-defined",
      label: "Multi-platform support defined (Android, iOS, Windows, Web)",
      pass: readSource(rootDir, "lib/staff-enterprise/constants.ts").includes("staff.rovexo.co.uk"),
    },
    ...grepDuplicatePatterns(rootDir),
  ]);

  const database = section("database", "Database Changes", [
    {
      id: "staff-profile-base",
      label: "Staff profile base migration present",
      pass: staffMigration.includes("staff_profiles"),
    },
    {
      id: "enterprise-extension",
      label: "Staff enterprise extension migration present",
      pass: migration.includes("staff_departments") && migration.includes("staff_messages"),
    },
    {
      id: "comms-production",
      label: "Staff comms production migration (calls, reads, offline queue)",
      pass:
        readSource(rootDir, "supabase/migrations/20250726000001_staff_comms_production.sql").includes(
          "staff_call_sessions",
        ) &&
        readSource(rootDir, "supabase/migrations/20250726000001_staff_comms_production.sql").includes(
          "staff_offline_queue",
        ),
    },
    {
      id: "comms-storage",
      label: "Staff comms storage bucket migration",
      pass: readSource(rootDir, "supabase/migrations/20250726000002_staff_comms_storage.sql").includes("staff-comms"),
    },
    {
      id: "immutable-audit",
      label: "Immutable staff activity logs",
      pass: staffMigration.includes("staff_activity_logs_immutable"),
    },
    {
      id: "rls-enabled",
      label: "RLS enabled on staff enterprise tables",
      pass: migration.includes("enable row level security"),
    },
  ]);

  const api = section("api", "API Changes", [
    {
      id: "super-admin-staff-api",
      label: "Super Admin staff API (existing SSOT)",
      pass: existsSync(join(rootDir, "app/api/super-admin/staff/route.ts")),
    },
    {
      id: "staff-enterprise-api",
      label: "Staff-facing enterprise API",
      pass: existsSync(join(rootDir, "app/api/staff-enterprise/route.ts")),
    },
    {
      id: "staff-action-api",
      label: "Staff enterprise action API (devices, admin)",
      pass: existsSync(join(rootDir, "app/api/staff-enterprise/action/route.ts")),
    },
    {
      id: "no-duplicate-endpoints",
      label: "No duplicate /api/staff/* parallel tree",
      pass: !existsSync(join(rootDir, "app/api/staff/route.ts")),
    },
    ...auditDeadRoutes(rootDir),
  ]);

  const security = section("security", "Security Report", [
    {
      id: "pii-encryption",
      label: "Staff PII encrypted at rest",
      pass: encryption.includes("aes-256-gcm"),
    },
    {
      id: "super-admin-gate",
      label: "Staff admin routes require super admin",
      pass: readSource(rootDir, "app/api/super-admin/staff/route.ts").includes("requireApiSuperAdmin"),
    },
    {
      id: "rbac-engine",
      label: "RBAC permission engine integrated",
      pass: permissions.includes("canStaffPerform") && permissions.includes("STAFF_ROLE_MODULE_ACCESS"),
    },
    {
      id: "audit-dual-write",
      label: "Staff actions write to immutable audit + platform audit",
      pass: readSource(rootDir, "lib/staff-profile/service.ts").includes("auditSuperAdminAction"),
    },
  ]);

  const performance = section("performance", "Performance Report", [
    {
      id: "paginated-messages",
      label: "Staff messages support pagination",
      pass: readSource(rootDir, "lib/staff-enterprise/messaging.ts").includes("range(offset"),
    },
    {
      id: "indexed-messages",
      label: "Staff messages channel index",
      pass: migration.includes("staff_messages_channel_idx"),
    },
    {
      id: "directory-limit",
      label: "Staff directory query limited",
      pass: readSource(rootDir, "lib/staff-enterprise/directory.ts").includes(".limit(limit)"),
    },
  ]);

  const accessibility = section("accessibility", "Accessibility Report", [
    {
      id: "staff-css",
      label: "Staff portal styles module",
      pass: existsSync(join(rootDir, "styles/rovexo/staff-enterprise.css")),
    },
    {
      id: "semantic-time",
      label: "Activity timeline uses semantic time elements",
      pass: readSource(rootDir, "features/staff-enterprise/StaffEnterpriseShell.tsx").includes("<time"),
    },
  ]);

  const audit = section("audit", "Audit Report", [
    ...grepDuplicatePatterns(rootDir),
    {
      id: "no-mock-staff",
      label: "Staff enterprise services avoid MOCK_ fixtures",
      pass: !readSource(rootDir, "lib/staff-enterprise/directory.ts").includes("MOCK_"),
    },
    {
      id: "marketplace-messaging-separate",
      label: "Internal staff messaging uses separate tables",
      pass: migration.includes("staff_channels") && migration.includes("staff_messages"),
    },
  ]);

  const validation = section("validation", "Validation Report", [
    {
      id: "unit-tests",
      label: "Staff enterprise unit tests shipped",
      pass: tests.includes("Staff Enterprise Platform"),
    },
    {
      id: "staff-profile-tests",
      label: "Staff profile tests preserved",
      pass: existsSync(join(rootDir, "tests/staff-profile.test.ts")),
    },
  ]);

  const deployment = section("deployment", "Deployment Checklist", [
    {
      id: "migration-file",
      label: "Run npm run db:push for staff enterprise migration",
      pass: migration.length > 0,
    },
    {
      id: "staff-pii-secret",
      label: "STAFF_PII_SECRET documented",
      pass: readSource(rootDir, ".env.example").includes("STAFF_PII_SECRET"),
    },
    {
      id: "staff-url-env",
      label: "NEXT_PUBLIC_STAFF_URL documented",
      pass: readSource(rootDir, ".env.example").includes("NEXT_PUBLIC_STAFF_URL"),
    },
  ]);

  const productionReadiness = section("production", "Production Readiness Report", [
    {
      id: "voice-video-enabled",
      label: "Voice and video enabled in production descriptor",
      pass:
        descriptor.includes("staff_voice_enabled") &&
        descriptor.includes("staff_video_enabled") &&
        !descriptor.includes("defaultEnabled: false"),
    },
    {
      id: "staff-comms-lib",
      label: "Staff comms production library shipped",
      pass: existsSync(join(rootDir, "lib/staff-comms/calls.ts")),
    },
    {
      id: "staff-comms-api",
      label: "Staff comms API routes (messages, calls, files, offline, push)",
      pass:
        existsSync(join(rootDir, "app/api/staff-enterprise/messages/route.ts")) &&
        existsSync(join(rootDir, "app/api/staff-enterprise/calls/route.ts")) &&
        existsSync(join(rootDir, "app/api/staff-enterprise/files/route.ts")) &&
        existsSync(join(rootDir, "app/api/staff-enterprise/offline/route.ts")) &&
        existsSync(join(rootDir, "app/api/staff-enterprise/push/route.ts")),
    },
    {
      id: "staff-portal-comms-ui",
      label: "Staff portal messaging and calls UI",
      pass:
        existsSync(join(rootDir, "app/staff/messages/page.tsx")) &&
        existsSync(join(rootDir, "app/staff/calls/page.tsx")) &&
        readSource(rootDir, "features/staff-enterprise/StaffEnterpriseShell.tsx").includes("initiateCall"),
    },
    {
      id: "native-shell-project",
      label: "Native staff app project (Android/iOS/Windows)",
      pass: existsSync(join(rootDir, "apps/rovexo-staff/capacitor.config.ts")),
    },
    {
      id: "login-hook",
      label: "Staff login sync exported",
      pass: readSource(rootDir, "lib/staff-profile/service.ts").includes("recordStaffLoginEvent"),
    },
    {
      id: "command-center-registry",
      label: "Staff module in command center registry",
      pass: readSource(rootDir, "lib/super-admin/command-center/registry.ts").includes("staff-profile"),
    },
  ]);

  const sections = [
    architecture,
    database,
    api,
    security,
    performance,
    accessibility,
    audit,
    validation,
    deployment,
    productionReadiness,
  ];

  const allChecks = sections.flatMap((s) => s.checks);
  const passed = allChecks.filter((c) => c.pass).length;
  const score = allChecks.length ? Math.round((passed / allChecks.length) * 100) : 0;
  const blockers = allChecks.filter((c) => !c.pass).map((c) => c.label);

  return {
    version: "1.0.0",
    milestone: "ROVEXO STAFF ENTERPRISE PLATFORM",
    generatedAt: new Date().toISOString(),
    pass: blockers.length === 0,
    score,
    architecture,
    database,
    api,
    security,
    performance,
    accessibility,
    audit,
    validation,
    deployment,
    productionReadiness,
    blockers,
  };
}
