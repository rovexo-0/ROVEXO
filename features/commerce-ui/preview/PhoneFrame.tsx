import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PhoneFrameProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Device frame for UI-lock preview — mobile-first, pixel-perfect review. */
export function PhoneFrame({ label, children, className }: PhoneFrameProps) {
  return (
    <figure className={cn("flex flex-col items-center gap-ds-3", className)}>
      <figcaption className="text-sm font-semibold text-text-primary">{label}</figcaption>
      <div className="relative w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-border bg-background shadow-[var(--ds-shadow-floating)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-ds-2">
          <span className="h-1 w-16 rounded-ds-full bg-border" aria-hidden />
        </div>
        <div className="max-h-[844px] overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </figure>
  );
}
