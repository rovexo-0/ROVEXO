"use client";

import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";
import { focusRing } from "@/components/ui/tokens";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="radio"
      className={cn("h-5 w-5 border border-[var(--ds-color-border)] bg-surface text-primary accent-primary", focusRing, className)}
      {...props}
    />
  );
});
