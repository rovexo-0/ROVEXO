import type { ReactNode } from "react";
import type { HomepageBuilderComponent } from "@/lib/platform-visual/types";
import { componentStyleToInlineStyle } from "@/lib/platform-visual/styles";
import { cn } from "@/lib/cn";

type VisualSectionProps = {
  component: HomepageBuilderComponent;
  className?: string;
  children: ReactNode;
};

export function VisualSection({ component, className, children }: VisualSectionProps) {
  return (
    <div
      className={cn("rx-visual-section", className)}
      data-component-id={component.id}
      data-visible-desktop={component.visibility.desktop}
      data-visible-tablet={component.visibility.tablet}
      data-visible-mobile={component.visibility.mobile}
      style={componentStyleToInlineStyle(component.style)}
    >
      {children}
    </div>
  );
}
