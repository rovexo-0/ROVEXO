"use client";

import { useEffect, type ReactNode } from "react";
import { isDocumentVisible, subscribeDocumentVisibility } from "@/lib/performance/visibility";
import "@/styles/performance-hidden.css";

type PageVisibilityProviderProps = {
  children: ReactNode;
};

function applyPageHiddenState(hidden: boolean) {
  const root = document.documentElement;
  if (hidden) {
    root.dataset.pageHidden = "true";
  } else {
    delete root.dataset.pageHidden;
  }
}

export function PageVisibilityProvider({ children }: PageVisibilityProviderProps) {
  useEffect(() => {
    applyPageHiddenState(!isDocumentVisible());
    return subscribeDocumentVisibility((visible) => {
      applyPageHiddenState(!visible);
    });
  }, []);

  return children;
}
