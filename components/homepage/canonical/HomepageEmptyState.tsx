"use client";

import Link from "next/link";
import { PremiumEmptyStateImage } from "@/components/ui/PremiumEmptyStateImage";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

type HomepageEmptyStateProps = {
  variant: "listings" | "recommendations";
};

type EmptyStateCopy = {
  title: string;
  description: string;
  illustration: "featured-listings" | "recommended";
  href?: string;
  action?: string;
};

const COPY: Record<HomepageEmptyStateProps["variant"], EmptyStateCopy> = {
  listings: {
    title: "No Listings Yet",
    description: "New listings from sellers across ROVEXO will show up here soon.",
    illustration: "featured-listings",
    href: "/search",
    action: "Browse search",
  },
  recommendations: {
    title: "No Recommendations Yet",
    description: "Personalised picks will appear when we learn what you like.",
    illustration: "recommended",
    href: "/",
    action: "Explore homepage",
  },
};

export function HomepageEmptyState({ variant }: HomepageEmptyStateProps) {
  const content = COPY[variant];

  return (
    <div
      className={css.emptyState}
      role="status"
      data-hp-empty={variant}
      data-homepage-empty={variant}
      data-homepage-listing-container={variant === "listings" ? "empty" : undefined}
    >
      <PremiumEmptyStateImage id={content.illustration} className={css.emptyIllustration} />
      <h2 className={css.emptyTitle}>{content.title}</h2>
      <p className={css.emptyDescription}>{content.description}</p>
      {content.action && content.href ? (
        <Link href={content.href} className={css.emptyAction}>
          {content.action}
        </Link>
      ) : null}
    </div>
  );
}
