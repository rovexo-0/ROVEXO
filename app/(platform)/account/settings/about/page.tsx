import { redirect } from "next/navigation";

/** About ROVEXO Settings page removed — redirect to Settings hub. */
export default function SettingsAboutRemovedRedirect() {
  redirect("/account/settings");
}
