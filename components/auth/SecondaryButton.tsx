import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function SecondaryButton({ className, size = "lg", fullWidth = true, ...props }: ButtonProps) {
  return (
    <Button
      variant="secondary"
      size={size}
      fullWidth={fullWidth}
      className={cn(
        "auth-secondary-button min-h-[52px] rounded-[16px] text-[17px] font-semibold",
        className,
      )}
      {...props}
    />
  );
}
