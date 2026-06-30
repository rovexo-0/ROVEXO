import { RovexoAppIconMark } from "@/components/brand/RovexoAppIconMark";
import { cn } from "@/lib/cn";

type RovexoLogo3DProps = {
  className?: string;
};

/** Official ROVEXO premium 3D mark — same asset as app icon */
export function RovexoLogo3D({ className }: RovexoLogo3DProps) {
  return <RovexoAppIconMark className={cn("hero-logo-3d", className)} uid="hero-logo-3d" />;
}
