import { redirect } from "next/navigation";

export default function AccountEditRedirect() {
  redirect("/account/profile");
}
