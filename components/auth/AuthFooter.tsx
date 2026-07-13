import { cn } from "@/lib/cn";

type AuthFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFooter({ children, className }: AuthFooterProps) {
  return (
    <footer className={cn("auth-footer text-center text-sm text-text-secondary", className)}>
      {children}
    </footer>
  );
}
