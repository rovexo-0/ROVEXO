import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type CategoryCardProps = {
  href: string;
  label: string;
  icon: ReactNode;
  className?: string;
};

export function CategoryCard({ href, label, icon, className }: CategoryCardProps) {
  return (
    <Link href={href} className={cn("rx-category-tile-link", className)}>
      <div className="rx-category-tile">{icon}</div>
      <p className="rx-category-tile-label">{label}</p>
    </Link>
  );
}
