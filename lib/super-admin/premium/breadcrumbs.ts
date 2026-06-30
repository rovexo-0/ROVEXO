import { listEnterpriseModuleDescriptors } from "@/lib/enterprise-architecture/registry";
import type { SuperAdminBreadcrumb } from "@/lib/super-admin/premium/types";

const SEGMENT_LABELS: Record<string, string> = {
  "super-admin": "Super Admin",
  development: "Development",
  governance: "Governance",
  omega: "OMEGA",
  automation: "Automation",
  "business-intelligence": "Business Intelligence",
  "module-registry": "Module Registry",
  "homepage-builder": "Homepage Builder",
  "mission-control-engine": "Mission Control Engine",
  "mobile-distribution": "Mobile Distribution",
  incidents: "Incidents",
  compliance: "Compliance",
  certification: "Certification",
  deployment: "Deployment",
  workflows: "Workflows",
  security: "Security",
  operations: "Operations",
  recovery: "Recovery",
  audit: "Audit",
};

function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resolveDescriptorLabel(pathname: string): string | undefined {
  for (const enterpriseModule of listEnterpriseModuleDescriptors()) {
    if (pathname === enterpriseModule.baseHref || pathname.startsWith(`${enterpriseModule.baseHref}/`)) {
      const route = enterpriseModule.routes.find((item) => item.href === pathname);
      if (route) return route.label;
      return enterpriseModule.label;
    }
  }
  return undefined;
}

export function buildSuperAdminBreadcrumbs(pathname: string): SuperAdminBreadcrumb[] {
  if (pathname === "/super-admin") {
    return [{ label: "Mission Control" }];
  }

  const descriptorLabel = resolveDescriptorLabel(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: SuperAdminBreadcrumb[] = [{ label: "Mission Control", href: "/super-admin" }];

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    path += `/${segment}`;
    if (segment === "super-admin") continue;

    const isLast = i === segments.length - 1;
    const label =
      isLast && descriptorLabel
        ? descriptorLabel
        : SEGMENT_LABELS[segment] ?? titleCase(segment);

    crumbs.push(isLast ? { label } : { label, href: path });
  }

  return crumbs;
}
