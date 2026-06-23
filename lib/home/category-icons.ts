import type { HomeCategoryIconType } from "@/lib/home/constants";

const ICON_VERSION = "v3";

/** 512×512 WebP sources — displayed at 54×54 in the category rail */
export const HOME_CATEGORY_ICON_SRC: Record<HomeCategoryIconType, string> = {
  vehicles: `/categories/home/vehicles.webp?${ICON_VERSION}`,
  property: `/categories/home/property.webp?${ICON_VERSION}`,
  phones: `/categories/home/phones.webp?${ICON_VERSION}`,
  computers: `/categories/home/computers.webp?${ICON_VERSION}`,
  fashion: `/categories/home/fashion.webp?${ICON_VERSION}`,
  electronics: `/categories/home/electronics.webp?${ICON_VERSION}`,
  furniture: `/categories/home/furniture.webp?${ICON_VERSION}`,
  "home-garden": `/categories/home/home-garden.webp?${ICON_VERSION}`,
  sports: `/categories/home/sports.webp?${ICON_VERSION}`,
  pets: `/categories/home/pets.webp?${ICON_VERSION}`,
  jobs: `/categories/home/jobs.webp?${ICON_VERSION}`,
  services: `/categories/home/services.webp?${ICON_VERSION}`,
  autoparts: `/categories/home/autoparts.webp?${ICON_VERSION}`,
  wholesale: `/categories/home/wholesale.webp?${ICON_VERSION}`,
  auctions: `/categories/home/auctions.webp?${ICON_VERSION}`,
  more: `/categories/home/more.webp?${ICON_VERSION}`,
};

export function getHomeCategoryIconSrc(icon: HomeCategoryIconType): string {
  return HOME_CATEGORY_ICON_SRC[icon];
}
