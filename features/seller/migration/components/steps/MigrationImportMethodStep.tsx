"use client";

import { Card } from "@/components/ui/Card";
import { MIGRATION_IMPORT_METHODS } from "@/lib/seller/migration/constants";
import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type MigrationImportMethodStepProps = {
  selected: MigrationImportMethodId | null;
  onSelect: (method: MigrationImportMethodId) => void;
};

export function MigrationImportMethodStep({ selected, onSelect }: MigrationImportMethodStepProps) {
  return (
    <div className="flex flex-col gap-ds-3">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Choose import method</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Pick how you want to bring items across. Parsers and connectors attach to these methods.
        </p>
      </div>
      <ul className="flex flex-col gap-ds-2" role="listbox" aria-label="Import methods">
        {MIGRATION_IMPORT_METHODS.map((method) => {
          const isSelected = selected === method.id;
          return (
            <li key={method.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(method.id)}
                className={cn(
                  "premium-card flex w-full items-start gap-ds-3 p-ds-4 text-left",
                  isSelected && "ring-2 ring-primary",
                  focusRing,
                )}
              >
                <span className="text-xl" aria-hidden>
                  {method.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary">{method.name}</span>
                  <span className="mt-ds-1 block text-xs text-text-secondary">{method.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Card padding="sm" className="border-dashed border-border">
        <p className="text-xs text-text-secondary">
          File uploads and API credentials will connect here when marketplace integrations launch.
        </p>
      </Card>
    </div>
  );
}
