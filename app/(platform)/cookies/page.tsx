import { redirect } from "next/navigation";

export default function CookiePolicyRedirect() {
  redirect("/legal/cookie-policy");
}
