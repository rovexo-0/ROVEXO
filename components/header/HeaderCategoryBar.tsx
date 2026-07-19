"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useRef } from "react";
import { HomeCategoryIcon3D } from "@/components/icons/HomeCategoryIcon3D";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import { cn } from "@/lib/cn";
import { focusRing, transitionNormal } from "@/components/ui/tokens";

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
    <nav aria-label="Browse categories" className={cn("rx-header-category-bar border-t border-[#eef2f7] bg-white", className)}>
      <div
        ref={scrollerRef}
        className={cn(
          "overflow-x-auto px-ds-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "scroll-smooth overscroll-x-contain touch-pan-x snap-x snap-mandatory",
        )}
      >
        <ul className="flex min-w-max gap-2 py-3">
          {HOME_CATEGORY_NAV.map((category) => {
            const href = `/category/${category.slug}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={category.slug} className="shrink-0 snap-start">
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rx-header-category-pill inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                    transitionNormal,
                    focusRing,
                    isActive
                      ? "border border-primary bg-primary text-primary-foreground"
                      : "border border-border bg-white text-text-secondary hover:border-primary/40 hover:text-primary",
                  )}
                >
                  <HomeCategoryIcon3D type={category.icon} size={20} />
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
