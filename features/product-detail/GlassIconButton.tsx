import { cn } from "@/lib/cn";
import { focusRing, transitionNormal } from "@/components/ui/tokens";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlassIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function GlassIconButton({
  label,
  children,
  className,
  type = "button",
  ...props
}: GlassIconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "flex min-h-ds-7 min-w-ds-7 items-center justify-center rounded-ds-full",
        "border border-border/60 bg-overlay text-text-primary shadow-ds-soft backdrop-blur-md backdrop-saturate-150",
        focusRing,
        transitionNormal,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
