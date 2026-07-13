import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { cn } from "@/lib/cn";

export function SecondaryButton({
  className,
  size = "lg",
  fullWidth = true,
  href,
  children,
  ...props
}: ButtonProps & { href?: string }) {
  const classes = cn(
    "auth-secondary-button inline-flex items-center justify-center",
    buttonVariants.secondary,
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
      variant="secondary"
      size={size}
      fullWidth={fullWidth}
      className={cn("auth-secondary-button min-h-[52px] rounded-[16px] text-[17px] font-semibold", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
