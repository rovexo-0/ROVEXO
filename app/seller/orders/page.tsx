import { permanentRedirect } from "next/navigation";

/** Seller orders list consolidates into canonical /orders Sold tab. */
export default function SellerOrdersRoute() {
  permanentRedirect("/orders");
}
