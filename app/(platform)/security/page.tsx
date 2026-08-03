import { redirect } from "next/navigation";

/** Parallel Security Engine hub removed — Settings → Security. */
export default function SecurityRoute() {
  redirect("/account/security");
}
