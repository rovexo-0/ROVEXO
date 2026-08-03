import { redirect } from "next/navigation";

/** Canonical Buying hub is /account/buying (Master Menu). */
export default function BuyerRedirect() {
  redirect("/account/buying");
}
