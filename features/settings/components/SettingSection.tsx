import { CanonicalCard, CanonicalSection } from "@/src/components/canonical";
import type { ReactNode } from "react";


type SettingSectionProps = {
  title: string;
  children: ReactNode;
  intro?: string;
};

export function SettingSection({ title, children, intro }: SettingSectionProps) {
  return (
    <CanonicalSection title={title} intro={intro}>
      <CanonicalCard variant="list">{children}</CanonicalCard>
    </CanonicalSection>
  );
}
