import { redirect } from "next/navigation";

/** Stripe is the only Business verification authority — no ROVEXO KYC hub. */
export default function BusinessVerificationRedirect() {
  redirect("/business/connect");
}
