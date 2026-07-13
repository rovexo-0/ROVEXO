import { cn } from "@/lib/cn";

type AuthContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthContainer({ children, className }: AuthContainerProps) {
  return <div className={cn("auth-container", className)}>{children}</div>;
}
