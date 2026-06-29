import { Suspense } from "react";
import { PaymentsEngineHub } from "@/features/payments-engine/PaymentsEngineHub";
import { PAYMENTS_ENGINE_MODULES } from "@/lib/payments-engine/registry";
import {
  getPaymentsEngineAnalyticsForUser,
  getPaymentsEngineContext,
  getPublicPaymentsEngineConfig,
  listPaymentsEngineSummaries,
} from "@/lib/payments-engine/reader";
import { getProfile } from "@/lib/profile/data";

export default async function PaymentsRoute() {
  const profile = await getProfile();
  const [config, context, summaries, analytics] = await Promise.all([
    getPublicPaymentsEngineConfig(),
    getPaymentsEngineContext(profile.id),
    listPaymentsEngineSummaries(profile.id),
    getPaymentsEngineAnalyticsForUser(profile.id),
  ]);

  return (
    <Suspense fallback={<div className="pe-hub p-ds-5">Loading payments…</div>}>
      <PaymentsEngineHub
        config={config}
        context={context}
        modules={PAYMENTS_ENGINE_MODULES}
        summaries={summaries}
        analytics={analytics}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Payments | ROVEXO",
    description: "ROVEXO Payments Engine — payment history, receipts, verification, and analytics.",
    robots: { index: false, follow: false },
  };
}
