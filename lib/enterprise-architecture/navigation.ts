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
    .filter((descriptor) => descriptor.autoRegister)
    .map((descriptor) => ({
      href: descriptor.baseHref,
      label: descriptor.label,
      description: descriptor.description,
      icon: descriptor.icon,
    }));
}

export function buildEnterpriseNavItem(moduleId: string): EnterpriseNavItem | undefined {
  const descriptor = getEnterpriseModuleDescriptor(moduleId);
  if (!descriptor) return undefined;
  return {
    href: descriptor.baseHref,
    label: descriptor.label,
    description: descriptor.description,
    icon: descriptor.icon,
  };
}

export function resolveModuleRouteHref(moduleId: string, routeId: string): string | undefined {
  const descriptor = getEnterpriseModuleDescriptor(moduleId);
  return descriptor?.routes.find((route) => route.id === routeId)?.href;
}
