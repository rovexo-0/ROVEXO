/**
 * Promote success copy — after wallet / default-card payment.
 * SSOT for `/promote?promotion=success&type=`
 */

export type PromotionSuccessContent = {
  title: string;
  body: string;
  expiresLabel: string;
};

export function resolvePromotionSuccessContent(
  type: string | null | undefined,
): PromotionSuccessContent {
  const expiresLabel = "7 Days";
  const map: Record<string, PromotionSuccessContent> = {
    bump: {
      title: "Bump Listing activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
    feature: {
      title: "Listing promoted successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
    store_featured: {
      title: "Store Showcase activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
    store_showcase: {
      title: "Store Showcase activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
    boost_package: {
      title: "Boost Package activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
    boost: {
      title: "Boost Package activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    },
  };

  return (
    (type ? map[type] : null) ?? {
      title: "Promotion activated successfully.",
      body: "Your promotion is now live.",
      expiresLabel,
    }
  );
}

export function resolvePromotionSuccessMessage(type: string | null | undefined): string {
  const content = resolvePromotionSuccessContent(type);
  return `${content.title} ${content.body} Expires in: ${content.expiresLabel}.`;
}
