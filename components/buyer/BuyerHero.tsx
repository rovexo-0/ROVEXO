"use client";

import Link from "next/link";
import { BuyerProfileCard } from "@/components/buyer/BuyerProfileCard";

export function BuyerHero() {
  return (
    <section className="buyer-hero" aria-label="Buyer profile">
      <BuyerProfileCard />
      <Link href="/orders" className="buyer-hero__cta">
        View orders
      </Link>
    </section>
  );
}
