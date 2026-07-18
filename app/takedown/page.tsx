import { redirect } from "next/navigation";

export default function NoticeTakedownRedirect() {
  redirect("/legal/intellectual-property-policy");
}
