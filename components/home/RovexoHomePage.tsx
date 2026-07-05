"use client";

import "@/styles/rovexo-homepage.css";
import { memo } from "react";

import type { ProductsPage } from "@/lib/products/types";

import { RovexoCategoryRail } from "@/components/home/RovexoCategoryRail";
import { RovexoAllListings } from "@/components/home/RovexoAllListings";

export type RovexoHomePageProps = {
  allListings: ProductsPage;
};

export const RovexoHomePage = memo(function RovexoHomePage({ allListings }: RovexoHomePageProps) {
  return (
    <main className="home-v1-main">
      <RovexoCategoryRail />
      <RovexoAllListings initialPage={allListings} />
    </main>
  );
});
