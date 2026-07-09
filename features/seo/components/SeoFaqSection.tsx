import type { FaqItem } from "@/lib/seo/engine/faq";

type SeoFaqSectionProps = {
  items: FaqItem[];
};

export function SeoFaqSection({ items }: SeoFaqSectionProps) {
  if (!items.length) return null;

  return (
    <section aria-labelledby="seo-faq-heading" className="mt-ds-8">
      <h2 id="seo-faq-heading" className="text-lg font-semibold text-text-primary">
        Frequently asked questions
      </h2>
      <div className="mt-ds-4 space-y-ds-4">
        {items.map((item) => (
          <article key={item.question} className="rounded-lg bg-surface-muted p-ds-4">
            <h3 className="text-sm font-medium text-text-primary">{item.question}</h3>
            <p className="mt-ds-2 text-sm text-text-secondary">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
