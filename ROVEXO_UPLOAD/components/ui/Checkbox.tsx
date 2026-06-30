"use client";

import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";
import { focusRing } from "@/components/ui/tokens";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 rounded-ds-sm border border-[var(--ds-color-border)] bg-surface text-primary accent-primary",
        focusRing,
        className,
      )}
      {...props}
    />
  );
});
