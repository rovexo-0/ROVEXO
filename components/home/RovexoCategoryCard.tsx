"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { RovexoCategory } from "@/components/home/constants";

type RovexoCategoryCardProps = {
  category: RovexoCategory;
  onNavigate?: () => void;
  className?: string;
  selected?: boolean;
};

/** Text-only category capsule — Module 1 (no icons). */
export function RovexoCategoryCard({
  category,
  onNavigate,
  className,
  selected = false,
}: RovexoCategoryCardProps) {
  return (
    <Link
      href={category.href}
      onClick={onNavigate}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "home-v1-category-capsule shrink-0",
        selected && "home-v1-category-capsule--selected",
        className,
      )}
    >
      {category.name}
    </Link>
  );
}
