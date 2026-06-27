"use client";

import Link from "next/link";
import { memo } from "react";
import { HOME_SECONDARY_BANNERS } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeSecondaryBannersProps = {
  className?: string;
};

export const HomeSecondaryBanners = memo(function HomeSecondaryBanners({
  className,
}: HomeSecondaryBannersProps) {
  return (
    <section aria-label="ROVEXO highlights" className={cn("rx-secondary-banners-section px-ds-4", className)}>
      <div className="rx-secondary-banners">
        {HOME_SECONDARY_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            className={cn("rx-secondary-banner", focusRing)}
          >
            <div className="rx-secondary-banner__copy">
              <p className="rx-secondary-banner__title">{banner.title}</p>
              <p className="rx-secondary-banner__subtitle">{banner.subtitle}</p>
            </div>
            <span className="rx-secondary-banner__cta">{banner.cta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
});
