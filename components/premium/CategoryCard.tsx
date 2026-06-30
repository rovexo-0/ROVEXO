"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CategoryPremiumIcon } from "@/components/category/CategoryPremiumIcon";
import { cn } from "@/lib/cn";
import type { PremiumCategory } from "@/components/premium/constants";

type CategoryCardProps = {
  category: PremiumCategory;
  onNavigate?: () => void;
  className?: string;
};

export function CategoryCard({ category, onNavigate, className }: CategoryCardProps) {
  return (
    <Link
      href={category.href}
      onClick={onNavigate}
      className={cn(
        "premium-category-card group relative flex w-[4.75rem] shrink-0 flex-col items-center gap-2 sm:w-[5.25rem]",
        className,
      )}
    >
      <motion.div whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
        <CategoryPremiumIcon
          icon={category.icon}
          size={40}
          containerSize={60}
          label={category.name}
          priority={false}
        />
      </motion.div>
      <span className="max-w-full truncate text-center text-xs font-semibold text-slate-800">
        {category.name}
      </span>
    </Link>
  );
}
