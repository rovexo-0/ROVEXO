import type { EnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/types";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";

export type PermissionCheckInput = {
  moduleId: string;
  action: string;
  role?: "super-admin";
  mfaVerified?: boolean;
  biometricVerified?: boolean;
};

export function canAccessModule(moduleId: string, role: "super-admin" = "super-admin"): boolean {
  const module = getEnterpriseModuleDescriptor(moduleId);
  if (!module) return false;
  return role === "super-admin";
}

export function canPerformModuleAction(input: PermissionCheckInput): { allowed: boolean; reason?: string } {
  const module = getEnterpriseModuleDescriptor(input.moduleId);
  if (!module) return { allowed: false, reason: "Module not registered" };
  if (!canAccessModule(input.moduleId, input.role ?? "super-admin")) {
    return { allowed: false, reason: "Insufficient role" };
  }

  const permission = module.permissions.find((item) => item.action === input.action);
  if (!permission) return { allowed: true };

  if (permission.requiresMfa && !input.mfaVerified) {
    return { allowed: false, reason: "MFA verification required" };
  }
  if (permission.requiresBiometric && !input.biometricVerified) {
    return { allowed: false, reason: "Biometric confirmation required" };
  }

  return { allowed: true };
}

export function getModulePermissions(module: EnterpriseModuleDescriptor) {
  return module.permissions;
}
