"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { getHomeCategoryIconSrc } from "@/lib/home/category-icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuctionsComingSoonPageProps = {
  isAuthenticated: boolean;
  initialSubscribed: boolean;
};

export function AuctionsComingSoonPage({
  isAuthenticated,
  initialSubscribed,
}: AuctionsComingSoonPageProps) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [confirmed, setConfirmed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNotify = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/login?next=/auctions");
      return;
    }

    if (subscribed || confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auctions/notify", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to save your request.");
      }

      setSubscribed(true);
      setConfirmed(true);
    } catch (notifyError) {
      setError(
        notifyError instanceof Error ? notifyError.message : "Unable to save your request.",
      );
    } finally {
      setLoading(false);
    }
  }, [confirmed, isAuthenticated, router, subscribed]);

  return (
    <BetaAppShell bottomNavTab="home">
      <main className="flex min-h-[calc(100dvh-var(--bottom-nav-height,0px))] flex-col items-center justify-center bg-white px-ds-5 py-ds-8 text-center">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-ds-5">
          <div
            className="flex h-[7.5rem] w-[7.5rem] items-center justify-center"
            aria-hidden
          >
            <Image
              src={getHomeCategoryIconSrc("auctions")}
              alt=""
              width={120}
              height={120}
              sizes="120px"
              priority
              draggable={false}
              className="h-[7.5rem] w-[7.5rem] object-contain drop-shadow-[0_18px_36px_rgba(15,23,42,0.14)]"
            />
          </div>

          <div className="flex flex-col gap-ds-2">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              New Features Coming Soon
            </h1>
            <p className="text-base font-medium text-text-secondary">
              A brand-new Auctions experience is on the way.
            </p>
          </div>

          <div className="max-w-sm space-y-ds-3 text-sm leading-relaxed text-text-secondary">
            <p>
              We&apos;re building a powerful new way to buy and sell through live auctions.
            </p>
            <p>
              Designed for speed, trust and simplicity, the new Auctions experience will bring
              exciting features to every ROVEXO user.
            </p>
            <p>Stay tuned — it&apos;s coming soon.</p>
          </div>

          {confirmed ? (
            <div
              className="w-full rounded-ds-lg border border-primary/20 bg-primary/5 px-ds-4 py-ds-4 text-center"
              role="status"
            >
              <p className="text-base font-semibold text-primary">Success!</p>
              <p className="mt-ds-1 text-sm text-text-secondary">
                We&apos;ll let you know the moment Auctions go live.
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex w-full flex-col gap-ds-3 pt-ds-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading || confirmed}
              onClick={() => void handleNotify()}
              className="min-h-ds-7 rounded-ds-lg text-base"
            >
              {loading ? "Saving…" : "Notify Me"}
            </Button>

            <Link
              href="/"
              className={cn(
                "inline-flex min-h-ds-7 w-full items-center justify-center rounded-ds-lg border border-border bg-secondary px-ds-4 text-base font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80",
                focusRing,
              )}
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    </BetaAppShell>
  );
}
