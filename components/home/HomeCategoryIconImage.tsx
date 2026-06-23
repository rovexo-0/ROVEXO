"use client";

import Image from "next/image";
import { memo } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { getHomeCategoryIconSrc } from "@/lib/home/category-icons";
import { cn } from "@/lib/cn";

type HomeCategoryIconImageProps = {
  type: HomeCategoryIconType;
  className?: string;
  priority?: boolean;
};

export const HomeCategoryIconImage = memo(function HomeCategoryIconImage({
  type,
  className,
  priority = false,
}: HomeCategoryIconImageProps) {
  return (
    <Image
      src={getHomeCategoryIconSrc(type)}
      alt=""
      aria-hidden
      width={54}
      height={54}
      sizes="54px"
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      draggable={false}
      className={cn("home-category-premium-icon-img", className)}
    />
  );
});
