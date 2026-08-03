"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

export default function SellerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="seller-page" style={{ padding: 16 }}>
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </div>
  );
}
