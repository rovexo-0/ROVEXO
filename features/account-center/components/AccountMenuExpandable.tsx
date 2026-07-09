"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { AccountMenuChild, AccountMenuItem } from "@/lib/account-center/canonical-menu";

type AccountMenuExpandableProps = {
  item: AccountMenuItem;
  icon: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccountMenuExpandable({
  item,
  icon,
  defaultOpen = false,
}: AccountMenuExpandableProps) {
  const [open, setOpen] = useState(defaultOpen);
  const children = item.children ?? [];

  return (
    <div className="ac-hub__expandable">
      <button
        type="button"
        id={`ac-hub-${item.id}`}
        className={cn("ac-hub__row ac-hub__row--expandable", transitionFast, focusRing)}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
        <span className="ac-hub__row-copy">
          <span className="ac-hub__row-title">
            <span className="truncate">{item.title}</span>
          </span>
        </span>
        <span
          className={cn("ac-hub__row-chevron ac-hub__row-chevron--toggle", open && "is-open")}
          aria-hidden
        >
          <ChevronRightLineIcon />
        </span>
      </button>
      {open ? (
        <div className="ac-hub__submenu" role="group" aria-label={`${item.title} menu`}>
          {children.map((child: AccountMenuChild) => (
            <Link
              key={child.id}
              href={child.href}
              id={`ac-hub-${child.id}`}
              className={cn("ac-hub__subrow", transitionFast, focusRing)}
            >
              <span className="ac-hub__subrow-title">{child.title}</span>
              <span className="ac-hub__row-chevron" aria-hidden>
                <ChevronRightLineIcon />
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
