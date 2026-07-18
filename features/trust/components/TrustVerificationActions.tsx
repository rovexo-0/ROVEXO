"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CanonicalButton, CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
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
      setMessage("Verification submitted for review.");
      router.refresh();
    } finally {
      setBusyType(null);
    }
  };

  return (
    <>
      <CanonicalCard variant="list">
        {VERIFICATION_TYPES.map((item) => {
          const record = verifications.find((entry) => entry.verificationType === item.type);
          const status = record?.status ?? "not_started";
          const canRequest = status === "not_started" || status === "rejected" || status === "expired";

          return (
            <CanonicalMenuRow
              key={item.type}
              title={item.label}
              description={item.description}
              value={canRequest ? undefined : status.replace(/_/g, " ")}
              showChevron={false}
              trailing={
                canRequest ? (
                  <CanonicalButton
                    variant="secondary"
                    disabled={busyType === item.type}
                    loading={busyType === item.type}
                    onClick={() => void requestVerification(item.type)}
                  >
                    Request
                  </CanonicalButton>
                ) : undefined
              }
            />
          );
        })}
      </CanonicalCard>
      {message ? <p className="cds-field__hint mt-ds-2 text-primary">{message}</p> : null}
    </>
  );
}
