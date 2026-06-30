import type { ReactNode } from "react";
import type { PlatformThemeTokens } from "@/lib/platform-visual/types";
import { themeTokensToCssVars } from "@/lib/platform-visual/styles";
import { cn } from "@/lib/cn";

type VisualThemeScopeProps = {
  theme: PlatformThemeTokens;
  mode?: "live" | "draft";
  className?: string;
  children: ReactNode;
};

export function VisualThemeScope({ theme, mode = "live", className, children }: VisualThemeScopeProps) {
  return (
    <div
      className={cn("rx-visual-theme-scope", mode === "draft" && "rx-visual-theme-scope--draft", className)}
      data-visual-mode={mode}
      style={themeTokensToCssVars(theme)}
    >
      {children}
    </div>
  );
}
