import Link from "next/link";
import { cn } from "@/lib/cn";
import { PLATFORM_OPERATOR_NOTICE } from "@/lib/legal/content";

type PlatformOperatorFooterNoticeProps = {
  className?: string;
};

export function PlatformOperatorFooterNotice({ className }: PlatformOperatorFooterNoticeProps) {
  return (
    <p className={cn("text-center text-sm text-gray-500 sm:text-left", className)}>
      <Link href="/legal" className="hover:text-[var(--ds-color-primary)] hover:underline">
        {PLATFORM_OPERATOR_NOTICE}
      </Link>
    </p>
  );
}
