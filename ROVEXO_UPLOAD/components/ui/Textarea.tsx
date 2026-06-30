"use client";

import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { rxInput } from "@/components/ui/tokens";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(rxInput, "min-h-[120px] py-ds-3", className)} {...props} />;
});
