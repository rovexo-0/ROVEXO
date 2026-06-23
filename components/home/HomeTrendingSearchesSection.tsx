import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HomeTrendingSearchesSectionProps = {
  searches: string[];
};

export function HomeTrendingSearchesSection({ searches }: HomeTrendingSearchesSectionProps) {
  if (!searches.length) return null;

  return (
    <section aria-labelledby="popular-searches-heading" className="px-ds-4">
      <h2 id="popular-searches-heading" className="mb-ds-3 text-lg font-semibold tracking-tight text-text-primary">
        Popular Searches
      </h2>
      <ul className="flex flex-wrap gap-ds-2">
        {searches.map((term) => (
          <li key={term}>
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              className={cn(
                "inline-flex min-h-ds-7 items-center rounded-ds-full border border-border bg-surface px-ds-4 text-sm font-medium text-text-secondary shadow-ds-soft",
                "hover:border-primary/30 hover:text-primary",
                focusRing,
              )}
            >
              {term}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
