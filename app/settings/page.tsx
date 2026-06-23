import type { Metadata } from "next";
import { SettingsPage } from "@/features/settings/components/SettingsPage";
import { fetchProfile } from "@/lib/profile/queries";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your ROVEXO account preferences, notifications, privacy, and security.",
};

export default async function SettingsRoute() {
  const profile = await fetchProfile();

  return <SettingsPage profile={profile} />;
}
