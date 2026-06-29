"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomePageShell } from "@/components/home/HomePageShell";
import { AuctionsLearnMoreModal } from "@/features/auctions/components/AuctionsLearnMoreModal";
import { Button } from "@/components/ui/Button";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import {
  AUCTIONS_COMING_SOON_FEATURES,
  AUCTIONS_NOTIFY_SUCCESS,
} from "@/lib/auctions/coming-soon-content";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const AuctionsComingSoonHero = dynamic(
  () =>
    import("@/features/auctions/components/AuctionsComingSoonHero").then(
      (mod) => mod.AuctionsComingSoonHero,
    ),
  {
    loading: () => <div className="auctions-soon-hero auctions-soon-hero--loading" aria-hidden />,
    ssr: false,
  },
);

type AuctionsComingSoonPageProps = {
  isLoggedIn: boolean;
  initialSubscribed: boolean;
};

export const AuctionsComingSoonPage = memo(function AuctionsComingSoonPage({
  isLoggedIn,
  initialSubscribed,
}: AuctionsComingSoonPageProps) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [notifyPending, setNotifyPending] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const handleNotify = useCallback(async () => {
    if (!isLoggedIn) {
      router.push("/login?next=/auctions");
      return;
    }

    if (subscribed || notifyPending) return;

    setNotifyPending(true);
    try {
      const response = await fetch("/api/auctions/notify", { method: "POST" });
      if (response.ok) {
        setSubscribed(true);
      }
    } finally {
      setNotifyPending(false);
    }
  }, [isLoggedIn, notifyPending, router, subscribed]);

  return (
    <BetaAppShell bottomNavTab="home">
      <HomePageShell header={<Header />} bottomNav={null}>
        <main className="auctions-soon-page">
          <div className="auctions-soon-page__inner">
            <header className="auctions-soon-header">
              <p className="auctions-soon-header__eyebrow">LIVE AUCTIONS</p>
              <span className="auctions-soon-badge">Coming in a future ROVEXO update</span>
            </header>

            <section className="auctions-soon-hero-panel" aria-labelledby="auctions-soon-heading">
              <div className="auctions-soon-hero-panel__visual">
                <AuctionsComingSoonHero />
              </div>

              <div className="auctions-soon-hero-panel__copy">
                <h1 id="auctions-soon-heading" className="auctions-soon-headline">
                  Coming Soon
                </h1>
                <p className="auctions-soon-subtitle">
                  We&apos;re putting the finishing touches on one of ROVEXO&apos;s most exciting features.
                </p>
                <p className="auctions-soon-subtitle auctions-soon-subtitle--muted">Stay tuned.</p>

                {subscribed ? (
                  <div className="auctions-soon-success" role="status">
                    <p className="auctions-soon-success__title">{AUCTIONS_NOTIFY_SUCCESS.title}</p>
                    <p className="auctions-soon-success__message">{AUCTIONS_NOTIFY_SUCCESS.message}</p>
                  </div>
                ) : null}

                <div className="auctions-soon-actions">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className={cn(
                      buttonVariants.primary,
                      buttonSizes.lg,
                      "auctions-soon-btn-primary min-h-12 border-0 px-8",
                      focusRing,
                    )}
                    disabled={subscribed || notifyPending}
                    onClick={() => void handleNotify()}
                  >
                    {notifyPending ? "Saving…" : "Notify Me"}
                  </Button>

                  <Link
                    href="/"
                    className={cn(
                      "inline-flex min-h-12 items-center justify-center px-8",
                      buttonVariants.secondary,
                      buttonSizes.lg,
                      focusRing,
                    )}
                  >
                    Back to Marketplace
                  </Link>

                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className={cn("min-h-12", focusRing)}
                    onClick={() => setLearnOpen(true)}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </section>

            <section className="auctions-soon-features" aria-labelledby="auctions-soon-features-heading">
              <h2 id="auctions-soon-features-heading" className="auctions-soon-features__title">
                Feature preview
              </h2>
              <ul className="auctions-soon-features__grid" role="list">
                {AUCTIONS_COMING_SOON_FEATURES.map((feature) => (
                  <li key={feature.label} className="auctions-soon-feature-card">
                    <span className="auctions-soon-feature-card__icon" aria-hidden>
                      {feature.icon}
                    </span>
                    <span className="auctions-soon-feature-card__label">{feature.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>

        <AuctionsLearnMoreModal open={learnOpen} onClose={() => setLearnOpen(false)} />
      </HomePageShell>
    </BetaAppShell>
  );
});
