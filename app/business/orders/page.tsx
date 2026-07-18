import { redirect } from "next/navigation";

/** Business Orders — canonical Orders Sold tab; stay linked to Business hub. */
export default function BusinessOrdersRedirect() {
  redirect("/orders?tab=sold&returnTo=/business/dashboard");
}
