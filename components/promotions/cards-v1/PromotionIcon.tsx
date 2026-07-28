import type { PromotionIconId } from "@/lib/promotions/catalog";

type PromotionIconProps = {
  icon: PromotionIconId;
};

export function PromotionIcon({ icon }: PromotionIconProps) {
  switch (icon) {
    case "arrow-up":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5 9 11l3.5 3.5L20 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 7H20v5.5" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.5l2.55 5.17 5.7.83-4.12 4.02.97 5.67L12 15.9l-5.1 2.68.97-5.67-4.12-4.02 5.7-.83L12 2.5z" />
        </svg>
      );
    case "rocket":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15.5c1.5 0 3.2-.4 4.5-1.5L18 5.5 18.5 6l-8.5 8.5C8.9 15.8 8.5 17.5 8.5 19"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5 18.5 9.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 18.5 8 16" />
          <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" />
        </svg>
      );
    case "crown":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4 18h16v2H4v-2zm1.2-8 2.8 3.2L12 6l4 7.2 2.8-3.2L20 16H4l1.2-6z" />
        </svg>
      );
    case "storefront":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9.5 5 4h14l2 5.5M4 9.5h16v10H4V9.5zm4 10v-5h8v5"
          />
        </svg>
      );
    default:
      return null;
  }
}
