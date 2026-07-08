import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export function HomepageV4Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="ROVEXO Home" className={cn("rx4-wordmark", focusRing, className)}>
      <span className="rx4-wordmark__text">ROVEXO</span>
    </Link>
  );
}
