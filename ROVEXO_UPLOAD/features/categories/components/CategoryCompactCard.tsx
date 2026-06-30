import Link from "next/link";
import { HomeCategoryIconImage } from "@/components/home/HomeCategoryIconImage";
import { resolveCategoryIconType } from "@/lib/home/category-icons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type CategoryCompactCardProps = {
  name: string;
  slug: string;
  subtitle: string;
  href?: string;
  className?: string;
};

export function CategoryCompactCard({
  name,
  slug,
  subtitle,
  href,
  className,
}: CategoryCompactCardProps) {
  const iconType = resolveCategoryIconType(slug);

  return (
    <Link
      href={href ?? `/category/${slug}`}
      className={cn("rx-category-card", focusRing, className)}
    >
      <HomeCategoryIconImage type={iconType} />
      <span className="rx-category-card__text">
        <span className="rx-category-card__title">{name}</span>
        <span className="rx-category-card__subtitle">{subtitle}</span>
      </span>
    </Link>
  );
}
