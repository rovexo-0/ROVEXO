import type { CategoryHubEditorial } from "@/lib/seo/category-hub-editorial-v1";
import { SeoFaqSection } from "@/features/seo/components/SeoFaqSection";

type CategoryHubEditorialProps = {
  editorial: CategoryHubEditorial;
};

/**
 * P12 Wave A — editorial below listings (listings-first).
 * Compact typography matching existing category page tokens — no redesign.
 */
export function CategoryHubEditorialSection({ editorial }: CategoryHubEditorialProps) {
  return (
    <div className="flex w-full flex-col gap-ds-4" data-seo-hub="category-wave-a">
      <section aria-labelledby="category-intro-heading">
        <h2 id="category-intro-heading" className="text-sm font-semibold text-text-primary">
          About this category
        </h2>
        <p className="mt-ds-2 text-sm text-text-secondary">{editorial.intro}</p>
      </section>

      <section aria-labelledby="buying-advice-heading" className="grid gap-ds-3 sm:grid-cols-2">
        <div>
          <h2 id="buying-advice-heading" className="text-sm font-semibold text-text-primary">
            Buying tips
          </h2>
          <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-4 text-sm text-text-secondary">
            {editorial.buyingAdvice.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Selling tips</h2>
          <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-4 text-sm text-text-secondary">
            {editorial.sellingAdvice.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      <SeoFaqSection items={editorial.faqItems} />
    </div>
  );
}
