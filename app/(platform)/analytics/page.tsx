import { redirect } from "next/navigation";

/** Parallel Analytics Engine hub removed — one Analytics entry via Selling/Business. */
export default function AnalyticsRoute() {
  redirect("/seller/analytics");
}
