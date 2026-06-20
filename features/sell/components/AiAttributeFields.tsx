"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AiAttributeFieldsProps = {
  brand: string;
  color: string;
  size: string;
  onBrandChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  showSize?: boolean;
  className?: string;
};

const fieldClassName =
  "min-h-ds-7 w-full rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm text-text-primary placeholder:text-text-muted";

export function AiAttributeFields({
  brand,
  color,
  size,
  onBrandChange,
  onColorChange,
  onSizeChange,
  showSize = true,
  className,
}: AiAttributeFieldsProps) {
  return (
    <div className={cn("grid gap-ds-4", className)}>
      <label className="flex flex-col gap-ds-2">
        <span className="text-sm font-medium text-text-primary">Brand</span>
        <input
          type="text"
          value={brand}
          onChange={(event) => onBrandChange(event.target.value)}
          placeholder="Enter brand"
          className={cn(fieldClassName, focusRing)}
        />
      </label>

      <label className="flex flex-col gap-ds-2">
        <span className="text-sm font-medium text-text-primary">Color</span>
        <input
          type="text"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          placeholder="Enter color"
          className={cn(fieldClassName, focusRing)}
        />
      </label>

      {showSize && (
        <label className="flex flex-col gap-ds-2">
          <span className="text-sm font-medium text-text-primary">Size</span>
          <input
            type="text"
            value={size}
            onChange={(event) => onSizeChange(event.target.value)}
            placeholder="Enter size (if applicable)"
            className={cn(fieldClassName, focusRing)}
          />
        </label>
      )}
    </div>
  );
}
