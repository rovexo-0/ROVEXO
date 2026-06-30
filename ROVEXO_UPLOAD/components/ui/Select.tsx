"use client";

import { cn } from "@/lib/cn";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { rxInput } from "@/components/ui/tokens";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn(rxInput, "appearance-none", className)} {...props} />;
});
