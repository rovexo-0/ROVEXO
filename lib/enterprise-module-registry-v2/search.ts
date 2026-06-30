import type { EnterpriseModuleV2Descriptor, RegistrySearchResult } from "@/lib/enterprise-module-registry-v2/types";

export type RegistrySearchQuery = {
  q?: string;
  category?: string;
  status?: string;
  owner?: string;
  version?: string;
  tag?: string;
  limit?: number;
};

export function searchRegistryModules(
  modules: EnterpriseModuleV2Descriptor[],
  query: RegistrySearchQuery,
): RegistrySearchResult[] {
  const q = query.q?.trim().toLowerCase() ?? "";
  const limit = query.limit ?? 50;
  const results: RegistrySearchResult[] = [];

  for (const enterpriseModule of modules) {
    const push = (matchType: RegistrySearchResult["matchType"], title: string, subtitle: string, href: string) => {
      results.push({
        id: `${enterpriseModule.moduleId}-${matchType}-${title}`,
        moduleId: enterpriseModule.moduleId,
        title,
        subtitle,
        href,
        matchType,
      });
    };

    if (query.category && enterpriseModule.category !== query.category) continue;
    if (query.status && enterpriseModule.status !== query.status) continue;
    if (query.owner && !enterpriseModule.owner.toLowerCase().includes(query.owner.toLowerCase())) continue;
    if (query.version && enterpriseModule.version !== query.version) continue;
    if (query.tag && !enterpriseModule.tags.includes(query.tag)) continue;

    const haystack = [
      enterpriseModule.moduleId,
      enterpriseModule.moduleName,
      enterpriseModule.displayName,
      enterpriseModule.description,
      enterpriseModule.category,
      enterpriseModule.owner,
      enterpriseModule.version,
      ...enterpriseModule.tags,
    ]
      .join(" ")
      .toLowerCase();

    if (q && !haystack.includes(q)) {
      const routeMatch = enterpriseModule.routes.some((r) => r.href.toLowerCase().includes(q) || r.label.toLowerCase().includes(q));
      const permMatch = enterpriseModule.permissions.some((p) => p.action.includes(q) || p.label.toLowerCase().includes(q));
      const flagMatch = enterpriseModule.featureFlags.some((f) => f.id.includes(q) || f.label.toLowerCase().includes(q));
      const depMatch = enterpriseModule.dependencies.some((d) => d.includes(q));
      const apiMatch = Object.values(enterpriseModule.apiSchema).some((v) => v.toLowerCase().includes(q));
      if (!routeMatch && !permMatch && !flagMatch && !depMatch && !apiMatch) continue;
    }

    if (!q || haystack.includes(q)) {
      push("module", enterpriseModule.displayName, enterpriseModule.description, enterpriseModule.baseHref);
    }

    for (const route of enterpriseModule.routes) {
      if (!q || route.href.toLowerCase().includes(q) || route.label.toLowerCase().includes(q)) {
        push("route", route.label, route.href, route.href);
      }
    }

    for (const permission of enterpriseModule.permissions) {
      if (!q || permission.action.includes(q) || permission.label.toLowerCase().includes(q)) {
        push("permission", permission.label, permission.action, enterpriseModule.baseHref);
      }
    }

    for (const tag of enterpriseModule.tags) {
      if (!q || tag.includes(q)) push("tag", tag, enterpriseModule.moduleName, enterpriseModule.baseHref);
    }

    for (const flag of enterpriseModule.featureFlags) {
      if (!q || flag.id.includes(q) || flag.label.toLowerCase().includes(q)) {
        push("feature-flag", flag.label, flag.id, enterpriseModule.baseHref);
      }
    }

    for (const dep of enterpriseModule.dependencies) {
      if (!q || dep.includes(q)) push("dependency", dep, `Required by ${enterpriseModule.moduleName}`, enterpriseModule.baseHref);
    }

    if (!q || enterpriseModule.apiSchema.snapshot.toLowerCase().includes(q)) {
      push("api", enterpriseModule.apiSchema.snapshot, enterpriseModule.moduleName, enterpriseModule.baseHref);
    }
  }

  const deduped = new Map<string, RegistrySearchResult>();
  for (const result of results) deduped.set(result.id, result);
  return [...deduped.values()].slice(0, limit);
}
