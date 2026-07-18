import type { ReactNode } from "react";
import { CanonicalCard } from "@/src/components/canonical";
import { cn } from "@/lib/cn";

type InfoBannerTone = "success" | "info";

type InfoBannerCardProps = {
  tone?: InfoBannerTone;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  className?: string;
};

/** Soft purple confirmation / status banner (order placed, on the way). */
export function InfoBannerCard({
  tone = "success",
  icon,
  title,
  description,
  className,
}: InfoBannerCardProps) {
  return (
    <CanonicalCard
      variant={tone === "success" ? "success" : "info"}
      className={cn("w-full", className)}
    >
      <div className="flex items-start gap-ds-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </CanonicalCard>
  );
}
