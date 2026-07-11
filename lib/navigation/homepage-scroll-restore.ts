const HOMEPAGE_SCROLL_KEY = "rovexo:homepage-scroll-y";

export function captureHomepageScroll(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  sessionStorage.setItem(HOMEPAGE_SCROLL_KEY, String(window.scrollY));
}

export function restoreHomepageScroll(): void {
  if (typeof window === "undefined") return;
  const raw = sessionStorage.getItem(HOMEPAGE_SCROLL_KEY);
  if (!raw) return;
  const offset = Number(raw);
  sessionStorage.removeItem(HOMEPAGE_SCROLL_KEY);
  if (!Number.isFinite(offset) || offset < 0) return;

  const apply = () => {
    window.scrollTo({ top: offset, left: 0, behavior: "instant" });
  };

  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

export function closeSearchAndReturnHome(navigate: (href: string) => void): void {
  restoreHomepageScroll();
  navigate("/");
}
