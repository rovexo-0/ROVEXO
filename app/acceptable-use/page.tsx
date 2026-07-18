import { redirect } from "next/navigation";

export default function acceptable_useLegalAliasRedirect() {
  redirect("/legal/acceptable-use-policy");
}
