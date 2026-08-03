import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { getCartSummary } from "@/lib/cart/store";
import { CartPage } from "@/features/cart/components/CartPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cart · ROVEXO",
  description: "Review items in your ROVEXO cart before checkout.",
  path: "/cart",
  noIndex: true,
});

export default async function Page() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/cart");
  }

  const cart = await getCartSummary(auth.user.id);
  return <CartPage cart={cart} />;
}
