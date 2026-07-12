import { revalidatePath } from "next/cache";

/** Server-side cache invalidation for promotion surfaces. */
export async function revalidatePromotionSurfaces(): Promise<void> {
  const paths = [
    "/",
    "/search",
    "/account/promotion-tools",
    "/seller/listings",
    "/account",
    "/super-admin/promotions",
    "/super-admin/promotion-management",
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}
