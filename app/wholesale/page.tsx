import type { Metadata } from "next";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { WholesaleCenterPage } from "@/features/wholesale/components/WholesaleCenterPage";
import { listOpenRfqRequests } from "@/lib/wholesale/service";
import { getAuthContext } from "@/lib/auth/session";
import { getWholesaleAccount } from "@/lib/wholesale/service";

export const metadata: Metadata = {
  title: "Wholesale Center | ROVEXO",
  description: "MOQ, bulk pricing, RFQ, and verified wholesale trade on ROVEXO.",
};

export default async function WholesalePage() {
  const auth = await getAuthContext();
  const account = auth ? await getWholesaleAccount(auth.user.id) : null;
  const rfqs = await listOpenRfqRequests();

  return (
    <BetaAppShell showBottomNav={false}>
      <WholesaleCenterPage account={account} rfqs={rfqs} />
    </BetaAppShell>
  );
}
