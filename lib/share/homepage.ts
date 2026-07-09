/** Canonical Homepage share payload — Web Share API + fallback channels. */
export const HOMEPAGE_SHARE = {
  title: "ROVEXO – Buy & Sell with Confidence",
  text: "Discover thousands of products from trusted sellers across the UK.",
  url: "https://www.rovexo.co.uk",
} as const;

export function getHomepageFacebookShareUrl(url: string = HOMEPAGE_SHARE.url): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getHomepageWhatsAppShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.text,
): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

export function getHomepageMessengerShareUrl(url: string = HOMEPAGE_SHARE.url): string {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}`;
}

export function getHomepageTelegramShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.title,
): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getHomepageXShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  text: string = HOMEPAGE_SHARE.title,
): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function getHomepageEmailShareUrl(
  url: string = HOMEPAGE_SHARE.url,
  title: string = HOMEPAGE_SHARE.title,
  text: string = HOMEPAGE_SHARE.text,
): string {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
}
