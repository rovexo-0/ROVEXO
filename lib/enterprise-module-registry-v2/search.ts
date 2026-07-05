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

  for (const mod of modules) {
    const push = (matchType: RegistrySearchResult["matchType"], title: string, subtitle: string, href: string) => {
      results.push({
        id: `${mod.moduleId}-${matchType}-${title}`,
        moduleId: mod.moduleId,
        title,
        subtitle,
        href,
        matchType,
      });
    };

    if (query.category && mod.category !== query.category) continue;
    if (query.status && mod.status !== query.status) continue;
    if (query.owner && !mod.owner.toLowerCase().includes(query.owner.toLowerCase())) continue;
    if (query.version && mod.version !== query.version) continue;
    if (query.tag && !mod.tags.includes(query.tag)) continue;

    const haystack = [
      mod.moduleId,
      mod.moduleName,
      mod.displayName,
      mod.description,
      mod.category,
      mod.owner,
      mod.version,
      ...mod.tags,
    ]
      .join(" ")
      .toLowerCase();

    if (q && !haystack.includes(q)) {
      const routeMatch = mod.routes.some((r) => r.href.toLowerCase().includes(q) || r.label.toLowerCase().includes(q));
      const permMatch = mod.permissions.some((p) => p.action.includes(q) || p.label.toLowerCase().includes(q));
      const flagMatch = mod.featureFlags.some((f) => f.id.includes(q) || f.label.toLowerCase().includes(q));
      const depMatch = mod.dependencies.some((d) => d.includes(q));
      const apiMatch = Object.values(mod.apiSchema).some((v) => v.toLowerCase().includes(q));
      if (!routeMatch && !permMatch && !flagMatch && !depMatch && !apiMatch) continue;
    }

    if (!q || haystack.includes(q)) {
      push("module", mod.displayName, mod.description, mod.baseHref);
    }

    for (const route of mod.routes) {
      if (!q || route.href.toLowerCase().includes(q) || route.label.toLowerCase().includes(q)) {
        push("route", route.label, route.href, route.href);
      }
    }

    for (const permission of mod.permissions) {
      if (!q || permission.action.includes(q) || permission.label.toLowerCase().includes(q)) {
        push("permission", permission.label, permission.action, mod.baseHref);
      }
    }

    for (const tag of mod.tags) {
      if (!q || tag.includes(q)) push("tag", tag, mod.moduleName, mod.baseHref);
    }

    for (const flag of mod.featureFlags) {
      if (!q || flag.id.includes(q) || flag.label.toLowerCase().includes(q)) {
        push("feature-flag", flag.label, flag.id, mod.baseHref);
      }
    }

    for (const dep of mod.dependencies) {
      if (!q || dep.includes(q)) push("dependency", dep, `Required by ${mod.moduleName}`, mod.baseHref);
    }

    if (!q || mod.apiSchema.snapshot.toLowerCase().includes(q)) {
      push("api", mod.apiSchema.snapshot, mod.moduleName, mod.baseHref);
    }
  }

  const deduped = new Map<string, RegistrySearchResult>();
  for (const result of results) deduped.set(result.id, result);
  return [...deduped.values()].slice(0, limit);
}
