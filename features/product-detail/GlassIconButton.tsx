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
        "flex h-10 w-10 items-center justify-center rounded-ds-full",
        // Solid opaque white disc + 1.5px border + deep shadow so the control
        // stays clearly visible over bright/HDR gallery images.
        "border-[1.5px] border-black/15 bg-white text-text-primary backdrop-blur-md",
        "shadow-[0_6px_18px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.18)]",
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
