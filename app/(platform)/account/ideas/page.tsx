import { Suspense } from "react";
import { RovexoIdeasPage } from "@/features/account-module/components/RovexoIdeasPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Rovexo Ideas | ROVEXO",
  description: "Share ideas with the Rovexo Ideas community.",
};
export default function AccountIdeasRoute() {
  return (
    <Suspense fallback={null}>
      <RovexoIdeasPage />
    </Suspense>
  );
}
