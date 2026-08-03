import { redirect } from "next/navigation";

export default function TermsOfServiceRedirect() {
  redirect("/legal/terms-and-conditions");
}
