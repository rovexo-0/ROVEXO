import {
  getEnterpriseModuleDescriptor,
  listEnterpriseModuleDescriptors,
} from "@/lib/enterprise-architecture/registry";

export type EnterpriseNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
};

export function buildEnterprisePrimaryNavItems(): EnterpriseNavItem[] {
  return listEnterpriseModuleDescriptors()
    .filter((module) => module.autoRegister)
    .map((module) => ({
      href: module.baseHref,
      label: module.label,
      description: module.description,
      icon: module.icon,
    }));
}

export function buildEnterpriseNavItem(moduleId: string): EnterpriseNavItem | undefined {
  const module = getEnterpriseModuleDescriptor(moduleId);
  if (!module) return undefined;
  return {
    href: module.baseHref,
    label: module.label,
    description: module.description,
    icon: module.icon,
  };
}

export function resolveModuleRouteHref(moduleId: string, routeId: string): string | undefined {
  const module = getEnterpriseModuleDescriptor(moduleId);
  return module?.routes.find((route) => route.id === routeId)?.href;
}
