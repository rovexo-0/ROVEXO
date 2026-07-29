"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OrderCheckoutConfirmationProps = {
  orderId: string;
};

export function OrderCheckoutConfirmation({ orderId }: OrderCheckoutConfirmationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmedRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || confirmedRef.current) {
      return;
    }

    confirmedRef.current = true;

    void fetch(`/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((payload: { success?: boolean }) => {
        router.replace(payload.success ? `/inbox?order=${encodeURIComponent(orderId)}&placed=1` : `/inbox?order=${encodeURIComponent(orderId)}`);
      })
      .catch(() => {
        router.replace(`/inbox?order=${encodeURIComponent(orderId)}`);
      });
  }, [orderId, router, searchParams]);

  return null;
}
