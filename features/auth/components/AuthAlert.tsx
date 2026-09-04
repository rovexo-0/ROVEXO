import { cn } from "@/lib/cn";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type AuthAlertProps = {
  message: string;
  variant: "error" | "success";
};

function AlertIcon({ variant }: { variant: AuthAlertProps["variant"] }) {
  return (
    <PlatformEmoji
      emoji={variant === "success" ? PLATFORM_EMOJI.check : PLATFORM_EMOJI.warning}
      size={20}
      className="h-5 w-5 shrink-0"
    />
  );
}

export function AuthAlert({ message, variant }: AuthAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-ds-2 rounded-ds-xl border px-ds-4 py-ds-3 text-sm",
        variant === "error"
          ? "border-danger/20 bg-danger/10 text-danger"
          : "border-success/20 bg-success/10 text-success",
      )}
    >
      <AlertIcon variant={variant} />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}
