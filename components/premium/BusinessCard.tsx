"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { PremiumBusiness } from "@/components/premium/constants";

type BusinessCardProps = {
  business: PremiumBusiness;
  className?: string;
};

export function BusinessCard({ business, className }: BusinessCardProps) {
  return (
    <Link href={business.href} className={cn("block shrink-0", className)}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "premium-business-card flex w-[16rem] flex-col gap-4 rounded-[1.5rem] border border-white/70 bg-white/90 p-5",
          "shadow-[0_20px_50px_-24px_rgba(99,102,241,0.35)] backdrop-blur-xl sm:w-[18rem]",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-violet-50 to-indigo-50">
            <Image src={business.logoUrl} alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{business.name}</p>
            <p className="truncate text-xs text-slate-500">{business.category}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          {business.verified ? (
            <span className="inline-flex items-center gap-1 font-semibold text-violet-600">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
              </svg>
              Verified Business
            </span>
          ) : (
            <span className="text-slate-400">Business</span>
          )}
          <span className="font-medium text-slate-600">{business.listingCount}+ listings</span>
        </div>
      </motion.div>
    </Link>
  );
}
