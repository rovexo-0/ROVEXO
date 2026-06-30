import { listEnterpriseModuleDescriptors } from "@/lib/enterprise-architecture/registry";
import { SUPER_ADMIN_QUICK_LINKS } from "@/lib/super-admin/nav";
import type { OmegaReadyPage } from "@/lib/super-admin/premium/types";

let cachedRegistry: OmegaReadyPage[] | null = null;

export function buildOmegaReadyRegistry(): OmegaReadyPage[] {
  if (cachedRegistry) return cachedRegistry;

  const seen = new Set<string>();
  const entries: OmegaReadyPage[] = [];

  const push = (entry: OmegaReadyPage) => {
    if (seen.has(entry.href)) return;
    seen.add(entry.href);
    entries.push(entry);
  };

  for (const enterpriseModule of listEnterpriseModuleDescriptors()) {
    if (!enterpriseModule.autoRegister) continue;
    push({
      id: enterpriseModule.id,
      href: enterpriseModule.baseHref,
      label: enterpriseModule.label,
      moduleId: enterpriseModule.id,
      tier: "enterprise",
      score: 100,
    });
    for (const route of enterpriseModule.routes) {
      push({
        id: `${enterpriseModule.id}:${route.id}`,
        href: route.href,
        label: route.label,
        moduleId: enterpriseModule.id,
        tier: "enterprise",
        score: 100,
      });
    }
  }

  for (const link of SUPER_ADMIN_QUICK_LINKS) {
    push({
      id: `nav:${link.href}`,
      href: link.href,
      label: link.label,
      moduleId: "super-admin",
      tier: "platform",
      score: 95,
    });
  }

  cachedRegistry = entries;
  return entries;
}

export function isOmegaReadyPath(pathname: string): boolean {
  return buildOmegaReadyRegistry().some((entry) => {
    if (entry.href === "/super-admin") return pathname === "/super-admin";
    return pathname === entry.href || pathname.startsWith(`${entry.href}/`);
  });
}

export function getOmegaReadyEntry(pathname: string): OmegaReadyPage | undefined {
  const exact = buildOmegaReadyRegistry().find((entry) => entry.href === pathname);
  if (exact) return exact;
  return buildOmegaReadyRegistry()
    .filter((entry) => entry.href !== "/super-admin" && pathname.startsWith(entry.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function resetOmegaReadyRegistryCache(): void {
  cachedRegistry = null;
}
