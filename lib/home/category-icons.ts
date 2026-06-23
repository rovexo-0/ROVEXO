import type { HomeCategoryIconType } from "@/lib/home/constants";

/** 512×512 WebP sources — displayed at 54×54 in the category rail */
export const HOME_CATEGORY_ICON_SRC: Record<HomeCategoryIconType, string> = {
  vehicles: "/categories/home/vehicles.webp",
  property: "/categories/home/property.webp",
  phones: "/categories/home/phones.webp",
  computers: "/categories/home/computers.webp",
  fashion: "/categories/home/fashion.webp",
  electronics: "/categories/home/electronics.webp",
  furniture: "/categories/home/furniture.webp",
  "home-garden": "/categories/home/home-garden.webp",
  sports: "/categories/home/sports.webp",
  pets: "/categories/home/pets.webp",
  jobs: "/categories/home/jobs.webp",
  services: "/categories/home/services.webp",
  autoparts: "/categories/home/autoparts.webp",
  wholesale: "/categories/home/wholesale.webp",
  auctions: "/categories/home/auctions.webp",
  more: "/categories/home/more.webp",
};

export function getHomeCategoryIconSrc(icon: HomeCategoryIconType): string {
  return HOME_CATEGORY_ICON_SRC[icon];
}
