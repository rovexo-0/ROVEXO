import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
export function PrimaryButton({ className, size = "lg", fullWidth = true, ...props }: ButtonProps) {
  return (
    <Button
      variant="primary"
      size={size}
      fullWidth={fullWidth}
      className={cn(
        "auth-primary-button min-h-[52px] rounded-[16px] text-[17px] font-semibold",
        className,
      )}
      {...props}
    />
  );
}
