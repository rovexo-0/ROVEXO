import { redirect } from "next/navigation";

export default function gdprLegalAliasRedirect() {
  redirect("/legal/gdpr-data-rights");
}
