import "server-only";

import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { appendAuditEntries, createAuditEntry } from "@/lib/marketplace-os/audit";

type MosGateOk = {
  ok: true;
  auth: Exclude<Awaited<ReturnType<typeof requireApiSuperAdmin>>, NextResponse>;
};

type MosGateFail = { ok: false; response: NextResponse };

/**
 * P11.1 C-01 — Marketplace OS APIs: super_admin only + rate limit + access audit.
 */
export async function requireMarketplaceOsAccess(
  request: Request,
  route: string,
): Promise<MosGateOk | MosGateFail> {
  const auth = await requireApiSuperAdmin(request);
  if (auth instanceof NextResponse) {
    return { ok: false, response: auth };
  }

  const limited = await enforceRateLimitForUser(auth.user.id, "marketplace-os", 60, 60_000);
  if (limited) {
    return { ok: false, response: limited };
  }

  appendAuditEntries([
    createAuditEntry({
      ruleId: "p11-1-mos-access",
      ruleVersion: 1,
      inputs: { route, userId: auth.user.id },
      outputs: {
        ruleId: "p11-1-mos-access",
        ruleVersion: 1,
        matched: true,
        actionsExecuted: [{ type: "access", target: route }],
        reason: `super_admin accessed ${route}`,
      },
      reason: `Authorized Marketplace OS access: ${route}`,
      newState: route,
    }),
  ]);

  return { ok: true, auth };
}
