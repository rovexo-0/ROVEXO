import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { cn } from "@/lib/cn";

export function AuthLogo({ className }: { className?: string }) {
  return <RovexoLogo className={cn("mx-auto w-fit", className)} />;
}
