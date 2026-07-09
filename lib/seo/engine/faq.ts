import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import { faqJsonLd } from "@/lib/seo/metadata";

export type FaqItem = { question: string; answer: string };

/** Template-based FAQ generation — no AI, driven by page context only. */
export function generatePageFaq(page: OrganicLandingPage, listingCount: number): FaqItem[] {
  const subject = page.title.replace(/ \| ROVEXO$/, "").replace(/ · ROVEXO$/, "");
  const items: FaqItem[] = [
    {
      question: `Where can I buy ${subject.toLowerCase()} on ROVEXO?`,
      answer: `Browse ${listingCount > 0 ? `${listingCount} ` : ""}${subject.toLowerCase()} listings on ROVEXO with purchase protection and secure checkout.`,
    },
    {
      question: `Is it safe to buy ${subject.toLowerCase()} on ROVEXO?`,
      answer:
        "Yes. ROVEXO offers purchase protection, verified sellers, and secure payments on eligible purchases across the UK marketplace.",
    },
  ];

  if (page.search.locationCity) {
    items.push({
      question: `Can I find local ${subject.toLowerCase()} in ${page.search.locationCity}?`,
      answer: `Yes. Filter by ${page.search.locationCity} to find local listings with collection or delivery options from verified sellers.`,
    });
  }

  if (page.search.brand) {
    items.push({
      question: `Are ${page.search.brand} listings authentic on ROVEXO?`,
      answer: `${page.search.brand} listings on ROVEXO come from verified sellers. Check item descriptions, photos, and seller ratings before purchasing.`,
    });
  }

  if (page.search.maxPrice) {
    items.push({
      question: `What ${subject.toLowerCase()} can I get under £${page.search.maxPrice}?`,
      answer: `ROVEXO lists ${subject.toLowerCase()} under £${page.search.maxPrice} from individual and business sellers across the UK.`,
    });
  }

  if (page.search.conditions?.length) {
    items.push({
      question: `What condition are ${subject.toLowerCase()} listings in?`,
      answer: `This page shows ${page.search.conditions.join(", ").toLowerCase()} condition listings. Each listing displays its exact condition in the product details.`,
    });
  }

  if (page.kind === "collection" && page.slug.includes("trending")) {
    items.push({
      question: `Why are these ${subject.toLowerCase()} trending?`,
      answer:
        "Trending collections are ranked automatically from live marketplace signals including views, saves, and recent sales activity.",
    });
  }

  return items.slice(0, 6);
}

export function pageFaqJsonLd(items: FaqItem[]) {
  if (!items.length) return null;
  return faqJsonLd(items);
}
