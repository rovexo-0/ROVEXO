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
    .filter((enterpriseModule) => enterpriseModule.autoRegister)
    .map((enterpriseModule) => ({
      href: enterpriseModule.baseHref,
      label: enterpriseModule.label,
      description: enterpriseModule.description,
      icon: enterpriseModule.icon,
    }));
}

export function buildEnterpriseNavItem(moduleId: string): EnterpriseNavItem | undefined {
  const enterpriseModule = getEnterpriseModuleDescriptor(moduleId);
  if (!enterpriseModule) return undefined;
  return {
    href: enterpriseModule.baseHref,
    label: enterpriseModule.label,
    description: enterpriseModule.description,
    icon: enterpriseModule.icon,
  };
}

export function resolveModuleRouteHref(moduleId: string, routeId: string): string | undefined {
  const enterpriseModule = getEnterpriseModuleDescriptor(moduleId);
  return enterpriseModule?.routes.find((route) => route.id === routeId)?.href;
}
