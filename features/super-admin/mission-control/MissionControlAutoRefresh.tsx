"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type MissionControlAutoRefreshProps = {
  intervalMs?: number;
  children: React.ReactNode;
};

export function MissionControlAutoRefresh({
  intervalMs = 30_000,
  children,
}: MissionControlAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return <>{children}</>;
}
