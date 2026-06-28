import { isOmegaReadyPath } from "@/lib/super-admin/premium/omega-ready";
import type { PageReadinessResult } from "@/lib/super-admin/premium/types";
import { SUPER_ADMIN_QUICK_LINKS } from "@/lib/super-admin/nav";

const KNOWN_STUB_PREFIXES: string[] = [];

export function validateSuperAdminPageReadiness(pathname: string): PageReadinessResult {
  const checks: string[] = [];
  const omegaReady = isOmegaReadyPath(pathname);
  const inNav = SUPER_ADMIN_QUICK_LINKS.some(
    (link) => link.href === pathname || (link.href !== "/super-admin" && pathname.startsWith(link.href)),
  );
  const notStub = !KNOWN_STUB_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (pathname.startsWith("/super-admin")) checks.push("Authenticated super-admin route");
  if (inNav || omegaReady) checks.push("Registered in navigation or enterprise registry");
  if (notStub) checks.push("No stub prefix detected");
  if (omegaReady) checks.push("OMEGA Ready registration");

  const scoreChecks = [
    pathname.startsWith("/super-admin"),
    inNav || omegaReady,
    notStub,
    omegaReady,
  ];
  const score = Math.round((scoreChecks.filter(Boolean).length / scoreChecks.length) * 100);

  return {
    ready: score >= 75 && notStub,
    score,
    checks,
    omegaReady,
  };
}
