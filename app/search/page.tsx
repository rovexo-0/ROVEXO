"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { useSearchOverlayOptional } from "@/features/search/client";

export default function SearchPage() {
  const searchOverlay = useSearchOverlayOptional();

  useEffect(() => {
    searchOverlay?.open();
  }, [searchOverlay]);

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <main className="px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        <Card padding="lg" className="shadow-ds-soft">
          <h1 className="text-xl font-semibold text-text-primary">Search</h1>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Use the search bar above to find products, sellers, stores, and categories.
          </p>
        </Card>
      </main>
    </BetaAppShell>
  );
}
