"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";

type IssueResolutionLinkProps = {
  orderId: string;
  className?: string;
};

export function IssueResolutionLink({ orderId, className }: IssueResolutionLinkProps) {
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/protection/cases?orderId=${encodeURIComponent(orderId)}`)
      .then((response) => response.json())
      .then((payload: { case?: { id: string } | null }) => {
        if (payload.case?.id) {
          setCaseId(payload.case.id);
        }
      })
      .catch(() => undefined);
  }, [orderId]);

  if (!caseId) {
    return (
      <Link href="/resolution" className={cn("text-sm font-medium text-primary underline", className)}>
        Open Resolution Centre
      </Link>
    );
  }

  return (
    <Link
      href={`/resolution/${caseId}`}
      className={cn(
        "inline-flex items-center justify-center",
        buttonVariants.secondary,
        buttonSizes.md,
        className,
      )}
    >
      View protection case
    </Link>
  );
}
