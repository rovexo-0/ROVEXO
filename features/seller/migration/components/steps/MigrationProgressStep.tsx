"use client";

import { MigrationImportProgressPanel } from "@/features/seller/migration/components/inline/MigrationImportProgressPanel";
import type { MigrationJob } from "@/lib/seller/migration/types";

type MigrationProgressStepProps = {
  job: MigrationJob | null;
  isSubmitting: boolean;
  platformLabel: string;
};

export function MigrationProgressStep(props: MigrationProgressStepProps) {
  return <MigrationImportProgressPanel {...props} />;
}
