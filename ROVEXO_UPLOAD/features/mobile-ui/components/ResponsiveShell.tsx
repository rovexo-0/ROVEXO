import type { ReactNode } from "react";

type ResponsiveShellProps = {
  mobile: ReactNode;
  desktop: ReactNode;
};

/** Renders mobile hub below lg; desktop layout at lg+ (unchanged). */
export function ResponsiveShell({ mobile, desktop }: ResponsiveShellProps) {
  return (
    <>
      <div className="mhub-mobile">{mobile}</div>
      <div className="mhub-desktop">{desktop}</div>
    </>
  );
}
