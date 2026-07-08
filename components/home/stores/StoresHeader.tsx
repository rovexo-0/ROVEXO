"use client";



import { Avatar } from "@/components/ui/Avatar";

import Link from "next/link";

import { memo, useId } from "react";

import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";

import css from "@/components/home/stores/StoresHeader.module.css";



const MAX_STORE_PRODUCTS = 3;



type StoresHeaderProps = {

  section: ShowcaseSellerSection;

};



function StarRow({ rating }: { rating: number }) {

  const uid = useId().replace(/:/g, "");

  const clamped = Math.max(0, Math.min(5, rating));



  return (

    <span className={css.stars} aria-hidden>

      {Array.from({ length: 5 }, (_, i) => {

        const fill = Math.max(0, Math.min(1, clamped - i));

        const gradId = `${uid}-s${i}`;

        return (

          <svg key={i} viewBox="0 0 24 24" width="12" height="12">

            <defs>

              <linearGradient id={gradId}>

                <stop offset={`${fill * 100}%`} stopColor="#FFC107" />

                <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />

              </linearGradient>

            </defs>

            <path

              fill={`url(#${gradId})`}

              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"

            />

          </svg>

        );

      })}

    </span>

  );

}



function formatReviewCount(count: number): string {

  if (count <= 0) return "No reviews";

  if (count === 1) return "1 review";

  return `${count.toLocaleString("en-GB")} reviews`;

}



export const StoresHeader = memo(function StoresHeader({ section }: StoresHeaderProps) {

  return (

    <header className={css.header}>

      <Link href={section.profileHref} className={css.identity}>

        <span className={css.avatar}>

          <Avatar
            src={section.sellerAvatar}
            alt={section.sellerName}
            name={section.sellerName}
            size="md"
            className="h-full w-full"
          />

        </span>

        <span className={css.meta}>

          <span className={css.name}>{section.sellerName}</span>

          <span className={css.ratingRow}>

            <StarRow rating={section.rating > 0 ? section.rating : 5} />

            <span className={css.reviews}>{formatReviewCount(section.reviewCount)}</span>

          </span>

        </span>

      </Link>

      <Link href={section.profileHref} className={css.visit}>

        Visit Store

      </Link>

    </header>

  );

});



export { MAX_STORE_PRODUCTS };


