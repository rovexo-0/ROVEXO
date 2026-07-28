"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

export default function BuyerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="buyer-page" style={{ padding: 16 }}>
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </div>
  );
}
