import { redirect } from "next/navigation";

/** No listing context — send shoppers to cart to continue. */
export default function CheckoutIndexRoute() {
  redirect("/cart");
}
