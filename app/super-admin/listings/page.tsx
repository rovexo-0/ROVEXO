import { redirect } from "next/navigation";

export default function SuperAdminListingsRedirectPage() {
  redirect("/super-admin/moderation");
}
