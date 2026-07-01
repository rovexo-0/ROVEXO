import { revalidatePath } from "next/cache";

/** Bust ISR / RSC caches after a listing is published or updated. */
export function revalidatePublishedListing(slug?: string | null): void {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/seller/listings");
  revalidatePath("/search");
  revalidatePath("/categories");

  if (slug) {
    revalidatePath(`/listing/${slug}`);
  }
}
