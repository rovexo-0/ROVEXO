"use client";

import { cn } from "@/lib/cn";
import type { PasswordRequirement } from "@/lib/auth/password-strength";

type ResetPasswordChecklistProps = {
  requirements: PasswordRequirement[];
  id?: string;
};

export function ResetPasswordChecklist({ requirements, id }: ResetPasswordChecklistProps) {
  return (
    <ul
      id={id}
      className="auth-password-checklist"
      aria-label="Password requirements"
      aria-live="polite"
    >
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className={cn(
            "auth-password-checklist__item",
            requirement.met && "auth-password-checklist__item--met",
          )}
        >
          <span className="auth-password-checklist__mark" aria-hidden>
            {requirement.met ? "✓" : "○"}
          </span>
          <span>{requirement.label}</span>
        </li>
      ))}
    </ul>
  );
}
