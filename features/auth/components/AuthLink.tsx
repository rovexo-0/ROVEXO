import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AuthLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function AuthLink({ href, children, className, style }: AuthLinkProps) {
  return (
    <Link
      href={href}
      className={cn(focusRing, transitionFast, className)}
      style={style}
    >
      {children}
    </Link>
  );
}
