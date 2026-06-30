import { cn } from "@/lib/cn";

export type PriceProps = {
  amount: number;
  originalAmount?: number | null;
  currency?: string;
  locale?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
};

const sizeStyles = {
  xs: { current: "text-sm", original: "text-[0.6875rem]" },
  sm: { current: "text-base", original: "text-xs" },
  md: { current: "text-lg", original: "text-sm" },
  lg: { current: "text-xl", original: "text-sm" },
} as const;

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function Price({
  amount,
  originalAmount,
  currency = "EUR",
  locale = "en-IE",
  className,
  size = "md",
}: PriceProps) {
  const styles = sizeStyles[size];
  const showOriginal =
    originalAmount != null && originalAmount > amount;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-ds-2", className)}>
      <span className={cn("font-bold text-text-primary", styles.current)}>
        {formatAmount(amount, currency, locale)}
      </span>
      {showOriginal && (
        <span className={cn("text-text-muted line-through", styles.original)}>
          {formatAmount(originalAmount, currency, locale)}
        </span>
      )}
    </div>
  );
}
