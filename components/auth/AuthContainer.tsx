import { cn } from "@/lib/cn";

type AuthContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthContainer({ children, className }: AuthContainerProps) {
  /* P13.1 — single landmark for Login/Register (layout unchanged). */
  return (
    <main id="main-content" className={cn("auth-container", className)}>
      {children}
    </main>
  );
}
