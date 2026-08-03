import { redirect } from "next/navigation";

/** Business Returns — operational resolution (never dump to legal-only page). */
export default function BusinessReturnsRedirect() {
  redirect("/resolution");
}
