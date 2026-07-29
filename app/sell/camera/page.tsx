import { redirect } from "next/navigation";

/**
 * Sell Camera entry — converges to canonical Sell host.
 * Product Integration owns camera session preparation on /sell (Phase III).
 * No parallel camera UI · no hardware implementation here.
 */
export default function SellCameraPage() {
  redirect("/sell");
}
