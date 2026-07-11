import { Suspense } from "react";
import { RovexoIdeasPage } from "@/features/account-module/components/RovexoIdeasPage";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = {
  ...privatePageMetadata,
  title: "Ideas | ROVEXO",
  description: "Propose improvements and follow ideas for ROVEXO.",
};

export default function AccountIdeasRoute() {
  return (
    <Suspense fallback={null}>
      <RovexoIdeasPage />
    </Suspense>
  );
}
