"use client";

import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <FailClosedPanel density="section" onRetry={() => reset()} />
    </div>
  );
}
