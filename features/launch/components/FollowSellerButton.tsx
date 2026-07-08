"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type FollowSellerButtonProps = {
  sellerId: string;
  compact?: boolean;
};

export function FollowSellerButton({ sellerId, compact = false }: FollowSellerButtonProps) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch(`/api/follows?sellerId=${sellerId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { following?: boolean } | null) => setFollowing(Boolean(payload?.following)))
      .catch(() => setFollowing(false));
  }, [sellerId]);

  const toggle = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/follows${following ? `?sellerId=${sellerId}` : ""}`, {
        method: following ? "DELETE" : "POST",
        headers: following ? undefined : { "Content-Type": "application/json" },
        body: following ? undefined : JSON.stringify({ sellerId }),
      });
      if (response.ok) setFollowing(!following);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size={compact ? "sm" : "md"}
      disabled={busy}
      onClick={() => void toggle()}
      className={compact ? "shrink-0 px-ds-3" : undefined}
    >
      {following ? "Following" : compact ? "Follow" : "Follow seller"}
    </Button>
  );
}
