import { redirect } from "next/navigation";

/** Parallel Shipping Engine hub removed — tracking lives on Orders. */
export default function ShippingRoute() {
  redirect("/orders");
}
