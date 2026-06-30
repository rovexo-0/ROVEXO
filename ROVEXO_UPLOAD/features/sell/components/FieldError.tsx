"use client";

import { cn } from "@/lib/cn";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs font-medium text-danger" role="alert">
      {message}
    </p>
  );
}

export function fieldErrorClassName(hasError: boolean): string {
  return cn(hasError && "ring-1 ring-danger/40");
}
