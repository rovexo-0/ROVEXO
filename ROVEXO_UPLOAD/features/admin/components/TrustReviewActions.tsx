"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TrustVerification } from "@/lib/trust/types";

type TrustReviewActionsProps = {
  verification: TrustVerification;
};

export function TrustReviewActions({ verification }: TrustReviewActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const review = async (status: "approved" | "rejected") => {
    setBusy(true);
    try {
      await fetch("/api/admin/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: verification.id, status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-ds-2">
      <Button variant="primary" disabled={busy} onClick={() => void review("approved")}>
        Approve
      </Button>
      <Button variant="secondary" disabled={busy} onClick={() => void review("rejected")}>
        Reject
      </Button>
    </div>
  );
}
