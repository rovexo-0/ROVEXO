import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type InfoBannerTone = "success" | "info";

type InfoBannerCardProps = {
  tone?: InfoBannerTone;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  className?: string;
};

const toneStyles: Record<InfoBannerTone, { surface: string; icon: string; title: string }> = {
  success: {
    surface: "border-primary/15 bg-primary/5",
    icon: "bg-primary/10 text-primary",
    title: "text-text-primary",
  },
  info: {
    surface: "border-primary/15 bg-primary/5",
    icon: "bg-primary/10 text-primary",
    title: "text-primary",
  },
};

/** Soft purple confirmation / status banner (order placed, on the way). */
export function InfoBannerCard({
  tone = "success",
  icon,
  title,
  description,
  className,
}: InfoBannerCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card padding="lg" className={cn("border", styles.surface, className)}>
      <div className="flex items-start gap-ds-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-full",
            styles.icon,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-base font-semibold", styles.title)}>{title}</p>
          <p className="mt-ds-1 text-sm text-text-secondary">{description}</p>
        </div>
      </div>
    </Card>
  );
}
