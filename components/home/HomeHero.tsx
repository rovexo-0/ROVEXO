import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type HomeHeroProps = {
  className?: string;
};

export function HomeHero({ className }: HomeHeroProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className={cn(
        "relative mx-ds-4 overflow-hidden rounded-ds-xl bg-[image:var(--ds-gradient-primary)] px-ds-5 py-ds-6 text-primary-foreground shadow-ds-soft md:mx-ds-4 md:px-ds-7 md:py-ds-8",
        className,
      )}
    >
      <p className="mb-ds-2 inline-flex rounded-ds-full bg-white/15 px-ds-3 py-ds-1 text-xs font-medium ring-1 ring-white/20">
        Buyer protection on every order
      </p>
      <h1 id="home-hero-heading" className="max-w-xl text-2xl font-bold leading-tight md:text-3xl">
        The marketplace where pre-loved meets premium
      </h1>
      <p className="mt-ds-2 max-w-md text-sm text-primary-foreground/85 md:text-base">
        Buy and sell fashion, tech, home, vehicles and more with verified sellers and secure checkout.
      </p>
      <div className="mt-ds-5 flex flex-wrap gap-ds-2">
        <Link
          href="/categories"
          className={cn(
            "inline-flex min-h-ds-7 items-center rounded-ds-full bg-white px-ds-5 text-sm font-semibold text-primary",
            transitionFast,
            focusRing,
          )}
        >
          Browse categories
        </Link>
        <Link
          href="/sell"
          className={cn(
            "inline-flex min-h-ds-7 items-center rounded-ds-full border border-white/40 px-ds-5 text-sm font-semibold text-white",
            transitionFast,
            focusRing,
            "hover:bg-white/10",
          )}
        >
          Sell for free
        </Link>
      </div>
    </section>
  );
}
