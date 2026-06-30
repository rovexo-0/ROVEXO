import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AuthLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function AuthLink({ href, children, className }: AuthLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-medium text-primary hover:opacity-80",
        focusRing,
        transitionFast,
        className,
      )}
    >
      {children}
    </Link>
  );
}
