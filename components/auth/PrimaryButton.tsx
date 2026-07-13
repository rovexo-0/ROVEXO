import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { cn } from "@/lib/cn";

export function PrimaryButton({
  className,
  size = "lg",
  fullWidth = true,
  href,
  children,
  ...props
}: ButtonProps & { href?: string }) {
  const classes = cn(
    "auth-primary-button inline-flex items-center justify-center",
    "auth-primary-button--gradient",
    buttonVariants.primary,
    buttonSizes[size],
    fullWidth && "w-full",
    "min-h-[52px] rounded-[16px] text-[17px] font-semibold",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      fullWidth={fullWidth}
      className={cn("auth-primary-button auth-primary-button--gradient min-h-[52px] rounded-[16px] text-[17px] font-semibold", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
