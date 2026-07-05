import { COMMAND_OS_ROOT_MODULES } from "@/lib/command-os-v4/registry";
import type { CommandOsSearchResult } from "@/lib/command-os-v4/types";
import { listCommandCenterModules } from "@/lib/super-admin/command-center/registry";
import { CERTIFICATION_MODULES } from "@/lib/certification-center-engine/registry";
import { XOS_MODULES } from "@/lib/design-studio-v1/xos-registry";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Global search across Command OS registries — modules, pages, configuration. */
export function searchCommandOs(query: string, limit = 40): CommandOsSearchResult[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  const pool: CommandOsSearchResult[] = [
    ...COMMAND_OS_ROOT_MODULES.map((mod) => ({
      id: `cos-${mod.id}`,
      label: mod.label,
      category: "Command OS",
      href: mod.href,
      snippet: mod.description,
    })),
    ...listCommandCenterModules().map((mod) => ({
      id: `cc-${mod.id}`,
      label: mod.label,
      category: "Command Center",
      href: mod.href,
      snippet: mod.description,
    })),
    ...CERTIFICATION_MODULES.map((mod) => ({
      id: `cert-${mod.id}`,
      label: mod.label,
      category: "Certification",
      href: mod.href,
      snippet: "Production certification module",
    })),
    ...XOS_MODULES.filter((mod) => !mod.internal).map((mod) => ({
      id: `xos-${mod.id}`,
      label: mod.label,
      category: "Experience OS",
      href: mod.href,
      snippet: mod.description,
    })),
  ];

  return pool
    .filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.snippet?.toLowerCase().includes(q),
    )
    .slice(0, limit);
}
