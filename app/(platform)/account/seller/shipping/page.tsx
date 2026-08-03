import { redirect } from "next/navigation";

/** Legacy path — Selling hub Shipping is canonical. */
export default function AccountSellerShippingRoute() {
  redirect("/seller/shipping");
}
