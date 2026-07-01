"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";

type RovexoSignOutLinkProps = {
  className?: string;
  label?: string;
};

export function RovexoSignOutLink({ className, label = "Log out" }: RovexoSignOutLinkProps) {
  return (
    <Link href="/auth/signout" className={cn("rovexo-sign-out", className)}>
      <RovexoIcon icon={RovexoIcons.security.logout} variant="settings" className="rovexo-sign-out__icon" />
      <span>{label}</span>
    </Link>
  );
}
