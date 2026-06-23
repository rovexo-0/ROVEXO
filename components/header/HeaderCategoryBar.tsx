"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useRef, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/cn";
import { homeCategories } from "@/lib/categories";
import { focusRing, transitionNormal } from "@/components/ui/tokens";

function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const iconProps: SVGProps<SVGSVGElement> = {
    className: cn("h-3.5 w-3.5 shrink-0", className),
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.75,
    stroke: "currentColor",
    "aria-hidden": true,
  };

  const icons: Record<string, ReactNode> = {
    fashion: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    electronics: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
      </svg>
    ),
    "home-garden": (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
    vehicles: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375M15 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.125v-4.125m0 0h-12" />
      </svg>
    ),
    sports: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.512v16.976M15 3.512v16.976M3.512 9h16.976M3.512 15h16.976" />
      </svg>
    ),
    beauty: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    toys: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
      </svg>
    ),
    books: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    collectibles: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    pets: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 11.25a8.625 8.625 0 1 1-16.5 0M12 20.25c.83 0 1.5-.671 1.5-1.5v-.75a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v.75c0 .829.671 1.5 1.5 1.5h4.5Z" />
      </svg>
    ),
  };

  return <>{icons[slug] ?? icons.fashion}</>;
}

export const HeaderCategoryBar = memo(function HeaderCategoryBar({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function handleWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      scroller?.scrollBy({ left: event.deltaY, behavior: "auto" });
    }

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <nav aria-label="Browse categories" className={cn("border-t border-border", className)}>
      <div
        ref={scrollerRef}
        className={cn(
          "overflow-x-auto px-ds-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
        )}
      >
        <ul className="flex min-w-max gap-ds-2 py-ds-2">
          {homeCategories.map((category) => {
            const href = `/category/${category.slug}`;
            const isActive = pathname === href;

            return (
              <li key={category.slug} className="shrink-0 snap-start">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-[2rem] items-center gap-ds-1 rounded-ds-full px-ds-3 py-1 text-xs font-medium",
                    transitionNormal,
                    focusRing,
                    isActive
                      ? "bg-[image:var(--ds-gradient-primary)] text-primary-foreground shadow-ds-soft"
                      : "border border-border/70 bg-surface text-text-secondary shadow-ds-soft hover:border-primary/25 hover:text-primary",
                  )}
                >
                  <CategoryIcon
                    slug={category.slug}
                    className={isActive ? "text-primary-foreground" : undefined}
                  />
                  <span className="whitespace-nowrap">{category.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
});
