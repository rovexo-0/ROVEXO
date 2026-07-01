"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    title: "Buyer Protection",
    description: "Every purchase is covered with secure payments and dispute support.",
    icon: "🛡️",
    gradient: "from-violet-500/10 to-indigo-500/10",
  },
  {
    title: "Verified Sellers",
    description: "Shop confidently with identity-verified sellers and trust scores.",
    icon: "✓",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    title: "Fast Delivery",
    description: "Track parcels from checkout to doorstep with premium carriers.",
    icon: "⚡",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Secure Payments",
    description: "Encrypted checkout powered by industry-leading payment rails.",
    icon: "🔒",
    gradient: "from-fuchsia-500/10 to-violet-500/10",
  },
];

export function BenefitsSection() {
  return (
    <section className="premium-section pb-8">
      <div className="premium-container">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Why ROVEXO</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Premium benefits</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className={`rounded-[1.5rem] border border-white/80 bg-gradient-to-br ${benefit.gradient} p-6 shadow-[0_16px_40px_-24px_rgba(99,102,241,0.25)] backdrop-blur-sm`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-md">
                {benefit.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
