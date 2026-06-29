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

  for (const module of modules) {
    const push = (matchType: RegistrySearchResult["matchType"], title: string, subtitle: string, href: string) => {
      results.push({
        id: `${module.moduleId}-${matchType}-${title}`,
        moduleId: module.moduleId,
        title,
        subtitle,
        href,
        matchType,
      });
    };

    if (query.category && module.category !== query.category) continue;
    if (query.status && module.status !== query.status) continue;
    if (query.owner && !module.owner.toLowerCase().includes(query.owner.toLowerCase())) continue;
    if (query.version && module.version !== query.version) continue;
    if (query.tag && !module.tags.includes(query.tag)) continue;

    const haystack = [
      module.moduleId,
      module.moduleName,
      module.displayName,
      module.description,
      module.category,
      module.owner,
      module.version,
      ...module.tags,
    ]
      .join(" ")
      .toLowerCase();

    if (q && !haystack.includes(q)) {
      const routeMatch = module.routes.some((r) => r.href.toLowerCase().includes(q) || r.label.toLowerCase().includes(q));
      const permMatch = module.permissions.some((p) => p.action.includes(q) || p.label.toLowerCase().includes(q));
      const flagMatch = module.featureFlags.some((f) => f.id.includes(q) || f.label.toLowerCase().includes(q));
      const depMatch = module.dependencies.some((d) => d.includes(q));
      const apiMatch = Object.values(module.apiSchema).some((v) => v.toLowerCase().includes(q));
      if (!routeMatch && !permMatch && !flagMatch && !depMatch && !apiMatch) continue;
    }

    if (!q || haystack.includes(q)) {
      push("module", module.displayName, module.description, module.baseHref);
    }

    for (const route of module.routes) {
      if (!q || route.href.toLowerCase().includes(q) || route.label.toLowerCase().includes(q)) {
        push("route", route.label, route.href, route.href);
      }
    }

    for (const permission of module.permissions) {
      if (!q || permission.action.includes(q) || permission.label.toLowerCase().includes(q)) {
        push("permission", permission.label, permission.action, module.baseHref);
      }
    }

    for (const tag of module.tags) {
      if (!q || tag.includes(q)) push("tag", tag, module.moduleName, module.baseHref);
    }

    for (const flag of module.featureFlags) {
      if (!q || flag.id.includes(q) || flag.label.toLowerCase().includes(q)) {
        push("feature-flag", flag.label, flag.id, module.baseHref);
      }
    }

    for (const dep of module.dependencies) {
      if (!q || dep.includes(q)) push("dependency", dep, `Required by ${module.moduleName}`, module.baseHref);
    }

    if (!q || module.apiSchema.snapshot.toLowerCase().includes(q)) {
      push("api", module.apiSchema.snapshot, module.moduleName, module.baseHref);
    }
  }

  const deduped = new Map<string, RegistrySearchResult>();
  for (const result of results) deduped.set(result.id, result);
  return [...deduped.values()].slice(0, limit);
}
