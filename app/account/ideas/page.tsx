import { RovexoIdeasPage } from "@/features/account-module/components/RovexoIdeasPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "ROVEXO Ideas | ROVEXO",
  description: "Share private suggestions to help improve ROVEXO.",
};

export default function AccountIdeasRoute() {
  return <RovexoIdeasPage />;
}
