/**
 * Business seller_context routes render in the PWA.
 * Extra Account-nav Business Bank / search-businesses UX stays Phase-C hidden.
 * This layout must not blanket-redirect `/business/*`.
 */
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
