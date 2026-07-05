import { redirect } from "next/navigation";

/** Seller shipping settings removed — ROVEXO manages shipping automatically. */
export default function AccountSellerShippingRoute() {
  redirect("/account/settings");
}
