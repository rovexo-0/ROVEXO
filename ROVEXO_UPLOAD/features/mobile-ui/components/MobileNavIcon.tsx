import type { ReactNode } from "react";

type MobileNavIconProps = {
  children: ReactNode;
};

export function MobileNavIcon({ children }: MobileNavIconProps) {
  return (
    <span className="mhub-icon" aria-hidden>
      {children}
    </span>
  );
}
