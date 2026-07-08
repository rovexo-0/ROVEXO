"use client";



import { memo } from "react";

import { ListingCard } from "@/components/ui/ListingCard";

import { HP4_LISTING_CARD_PROPS } from "@/components/homepage-v4/constants";

import type { Product } from "@/lib/products/types";



type HomepageV4FeaturedProps = {

  products: Product[];

};



export const HomepageV4Featured = memo(function HomepageV4Featured({

  products,

}: HomepageV4FeaturedProps) {

  if (products.length === 0) return null;



  return (

    <section aria-label="Curated listings" className="rx4-featured">

      <div className="rx4-carousel rx4-carousel--featured" role="list">

        {products.map((product, index) => (

          <div key={product.id} role="listitem" className="rx4-carousel__slide">

            <ListingCard

              {...HP4_LISTING_CARD_PROPS}

              product={product}

              variant="carousel"

              priority={index < 2}

              className="rx4-card--carousel"

              statusBadgeLabel="Featured"

              showStatusBadge

            />

          </div>

        ))}

      </div>

    </section>

  );

});

