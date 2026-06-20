import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { getCartSummary } from "@/lib/cart/store";
import { CartPage } from "@/features/cart/components/CartPage";

export default async function Page() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login?next=/cart");
  }

  const cart = await getCartSummary(auth.user.id);
  return <CartPage cart={cart} />;
}
