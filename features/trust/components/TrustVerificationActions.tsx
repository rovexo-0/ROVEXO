"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TrustVerification, TrustVerificationType } from "@/lib/trust/types";
import { VERIFICATION_TYPES } from "@/lib/trust/types";

type TrustVerificationActionsProps = {
  verifications: TrustVerification[];
};

export function TrustVerificationActions({ verifications }: TrustVerificationActionsProps) {
  const router = useRouter();
  const [busyType, setBusyType] = useState<TrustVerificationType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requestVerification = async (verificationType: TrustVerificationType) => {
    setBusyType(verificationType);
    setMessage(null);
    try {
      const response = await fetch("/api/trust/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationType }),
      });
      if (!response.ok) {
        setMessage("Unable to submit verification request.");
        return;
      }
      setMessage("Verification submitted for moderator review.");
      router.refresh();
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="mt-ds-4 space-y-ds-3">
      {VERIFICATION_TYPES.map((item) => {
        const record = verifications.find((entry) => entry.verificationType === item.type);
        const status = record?.status ?? "not_started";
        const canRequest = status === "not_started" || status === "rejected" || status === "expired";
        return (
          <div key={item.type} className="flex flex-wrap items-center justify-between gap-ds-3 border-t border-border pt-ds-3">
            <div>
              <p className="font-medium text-text-primary">{item.label}</p>
              <p className="text-sm text-text-secondary">{item.description}</p>
            </div>
            {canRequest ? (
              <Button
                variant="secondary"
                disabled={busyType === item.type}
                onClick={() => void requestVerification(item.type)}
              >
                Request
              </Button>
            ) : (
              <span className="text-sm capitalize text-text-muted">{status.replace(/_/g, " ")}</span>
            )}
          </div>
        );
      })}
      {message ? <p className="text-sm text-primary">{message}</p> : null}
    </div>
  );
}
