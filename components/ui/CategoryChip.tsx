import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type CategoryChipBaseProps = {
  label: string;
  active?: boolean;
  className?: string;
};

type CategoryChipLinkProps = CategoryChipBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

type CategoryChipButtonProps = CategoryChipBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

export type CategoryChipProps = CategoryChipLinkProps | CategoryChipButtonProps;

const chipStyles = (active?: boolean) =>
  cn(
    "inline-flex shrink-0 items-center rounded-ds-full px-ds-4 py-ds-2 text-sm font-medium sm:px-ds-5",
    transitionFast,
    focusRing,
    active
      ? "bg-primary/10 text-primary"
      : "text-text-secondary hover:bg-primary/10 hover:text-primary",
  );

export function CategoryChip(props: CategoryChipProps) {
  const { label, active, className } = props;

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(chipStyles(active), className)}
        {...linkProps}
      >
        {label}
      </Link>
    );
  }

  const { active: _active, label: _label, className: _className, ...buttonProps } =
  props as CategoryChipButtonProps;

  return (
    <button type="button" className={cn(chipStyles(active), className)} {...buttonProps}>
      {label}
    </button>
  );
}
