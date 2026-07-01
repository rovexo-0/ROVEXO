"use client";

import Link from "next/link";
import { getCategoryGlassIcon } from "@/lib/icons";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { cn } from "@/lib/cn";
import type { RovexoCategory } from "@/components/home/constants";

type RovexoCategoryCardProps = {
  category: RovexoCategory;
  onNavigate?: () => void;
  className?: string;
};

export function RovexoCategoryCard({ category, onNavigate, className }: RovexoCategoryCardProps) {
  const iconRef = getCategoryGlassIcon(category.icon);

  return (
    <Link
      href={category.href}
      onClick={onNavigate}
      className={cn("home-v1-category-tile shrink-0", className)}
    >
      <div className="home-v1-category-tile__slot">
        <RovexoIcon icon={iconRef} variant="category" className="home-v1-category-tile__icon" />
      </div>
      <span className="home-v1-category-tile__name">{category.name}</span>
    </Link>
  );
}
