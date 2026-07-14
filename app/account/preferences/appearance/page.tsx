import { redirect } from "next/navigation";

/** Appearance / dark theme removed — Light theme is the only supported UI. */
export default function AccountAppearanceRoute() {
  redirect("/account/settings");
}
