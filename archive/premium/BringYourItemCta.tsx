"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type BringYourItemCtaProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function BringYourItemCta({ href, children, className }: BringYourItemCtaProps) {
  return (
    <Link href={href} className={cn("home-v1-bring-your-item__cta-link", focusRing, className)}>
      <span className="home-v1-bring-your-item__cta">{children}</span>
    </Link>
  );
}
