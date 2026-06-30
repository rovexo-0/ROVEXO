"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/premium/PremiumButton";

export function ImportListingBanner() {
  return (
    <section className="premium-section">
      <div className="premium-container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 shadow-[0_24px_60px_-24px_rgba(99,102,241,0.65)] sm:p-10 lg:p-12"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Import listing</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Import Your Listing
                <span className="block text-white/90">in under 60 seconds</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Snap a photo, let AI fill the details, and publish to millions of buyers with premium visibility.
              </p>
            </div>
            <PremiumButton href="/sell" size="lg" variant="secondary" className="shrink-0">
              Import Listing
            </PremiumButton>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
