import { cn } from "@/lib/cn";

type AuthAlertProps = {
  message: string;
  variant: "error" | "success";
};

function AlertIcon({ variant }: { variant: AuthAlertProps["variant"] }) {
  if (variant === "success") {
    return (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
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
