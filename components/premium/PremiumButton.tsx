"use client";

import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type PremiumButtonProps = {
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const variantClasses = {
  primary:
    "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-[0_12px_40px_-12px_rgba(99,102,241,0.65)] hover:shadow-[0_16px_48px_-10px_rgba(99,102,241,0.75)]",
  secondary:
    "bg-white/90 text-slate-900 border border-white/60 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.2)] hover:bg-white",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100/80",
  glass:
    "bg-white/20 text-white border border-white/30 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-white/30",
};

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm font-semibold",
  lg: "h-14 px-7 text-base font-semibold",
};

export function PremiumButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className,
  type = "button",
  ...props
}: PremiumButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="inline-flex">
      <button type={type} className={classes} {...props}>
        {children}
      </button>
    </motion.div>
  );
}
