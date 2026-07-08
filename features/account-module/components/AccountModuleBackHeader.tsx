import Link from "next/link";
import type { ReactNode } from "react";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";

type AccountModuleBackHeaderProps = {
  title: string;
  backHref?: string;
  rightAction?: ReactNode;
};

export function AccountModuleBackHeader({
  title,
  backHref = "/account",
  rightAction,
}: AccountModuleBackHeaderProps) {
  return (
    <header className="acm-header">
      <Link href={backHref} className="acm-header__back" aria-label="Go back">
        <BackLineIcon />
      </Link>
      <h1 className="acm-header__title">{title}</h1>
      <div className="acm-header__action">{rightAction ?? <span aria-hidden />}</div>
    </header>
  );
}
