"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PremiumButton } from "@/components/premium/PremiumButton";

const floatingProducts = [
  { label: "Sneakers", color: "from-pink-400 to-rose-500", top: "18%", left: "8%", delay: 0 },
  { label: "Watch", color: "from-amber-400 to-orange-500", top: "12%", right: "10%", delay: 0.2 },
  { label: "Phone", color: "from-cyan-400 to-blue-500", bottom: "22%", left: "12%", delay: 0.4 },
  { label: "Bag", color: "from-violet-400 to-purple-600", bottom: "18%", right: "8%", delay: 0.6 },
];

export function PremiumHero() {
  return (
    <section className="premium-hero relative overflow-hidden">
      <div className="premium-hero__bg absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-fuchsia-400/40 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
      </div>

      {floatingProducts.map((item) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ duration: 4 + item.delay, repeat: Infinity, delay: item.delay }}
          className={`premium-hero__float absolute hidden rounded-2xl bg-gradient-to-br ${item.color} px-4 py-3 text-xs font-bold text-white shadow-2xl lg:block`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
          }}
        >
          {item.label}
        </motion.div>
      ))}

      <div className="premium-container relative z-[1] grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
            Premium Marketplace 2026
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Buy & sell with
            <span className="block bg-gradient-to-r from-white via-violet-100 to-cyan-100 bg-clip-text text-transparent">
              buyer protection
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Discover verified sellers, premium listings, and secure checkout — crafted for a seamless 2026 shopping experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PremiumButton href="/search" size="lg" variant="secondary">
              Start shopping
            </PremiumButton>
            <PremiumButton href="/sell" size="lg" variant="glass">
              Sell on ROVEXO
            </PremiumButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm lg:max-w-md"
        >
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-white/30 to-transparent blur-2xl" />
          <div className="relative rounded-[2.5rem] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="overflow-hidden rounded-[2rem] bg-slate-950">
              <div className="flex items-center justify-between px-5 py-3 text-[10px] font-medium text-white/70">
                <span>9:41</span>
                <span>ROVEXO</span>
                <span>100%</span>
              </div>
              <div className="space-y-3 px-4 pb-5">
                <div className="h-28 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 p-4 shadow-inner">
                  <p className="text-lg font-bold text-white">Featured drop</p>
                  <p className="mt-1 text-xs text-white/80">Limited premium picks</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-20 rounded-xl bg-white/10" />
                  <div className="h-20 rounded-xl bg-white/10" />
                  <div className="h-20 rounded-xl bg-white/10" />
                  <div className="h-20 rounded-xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 top-8 rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-xs font-bold text-violet-700 shadow-xl"
          >
            Verified sellers
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
