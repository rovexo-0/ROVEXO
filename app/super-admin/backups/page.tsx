import { redirect } from "next/navigation";

export default function SuperAdminBackupsRedirectPage() {
  redirect("/super-admin/recovery");
}
