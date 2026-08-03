import { redirect } from "next/navigation";

/** Parallel Protection Engine hub removed — Returns & Refunds is /resolution. */
export default function ProtectionRoute() {
  redirect("/resolution");
}
