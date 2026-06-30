import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type SettingSectionProps = {
  title: string;
  children: ReactNode;
};

export function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <section aria-labelledby={`settings-${title.replace(/\s+/g, "-").toLowerCase()}`} className="flex flex-col gap-ds-3">
      <h2
        id={`settings-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="px-ds-1 text-xs font-bold uppercase tracking-wider text-text-muted"
      >
        {title}
      </h2>
      <Card padding="none" className="overflow-hidden">
        {children}
      </Card>
    </section>
  );
}
