"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { OFFICIAL_BRAND_APP_ICON } from "@/lib/brand/official-brand-application-v1";

export function RvxTopBar({ children }: { children: ReactNode }) {
  return (
    <header className="rvx-topbar">
      <Link href="/" aria-label="ROVEXO home" className="rvx-topbar__logo">
        <SafeImage
          src={OFFICIAL_BRAND_APP_ICON}
          alt="ROVEXO"
          width={40}
          height={40}
          className="rvx-topbar__logo-img"
        />
      </Link>
      <div className="rvx-topbar__actions" role="group" aria-label="Quick links">
        {children}
      </div>
    </header>
  );
}

export function RvxTopBarIconLink({
  href,
  label,
  badge = 0,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className="rvx-topbar__icon">
      {children}
      {badge > 0 ? <span className="rvx-topbar__badge">{badge > 99 ? "99+" : badge}</span> : null}
    </Link>
  );
}
