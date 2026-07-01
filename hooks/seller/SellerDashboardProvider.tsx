"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SellerDashboardData } from "@/types/seller";

type SellerDashboardContextValue = {
  data: SellerDashboardData;
};

const SellerDashboardContext = createContext<SellerDashboardContextValue | null>(null);

export type SellerDashboardProviderProps = {
  data: SellerDashboardData;
  children: ReactNode;
};

export function SellerDashboardProvider({ data, children }: SellerDashboardProviderProps) {
  return (
    <SellerDashboardContext.Provider value={{ data }}>{children}</SellerDashboardContext.Provider>
  );
}

export function useSellerDashboard(): SellerDashboardContextValue {
  const context = useContext(SellerDashboardContext);
  if (!context) {
    throw new Error("useSellerDashboard must be used within SellerDashboardProvider");
  }
  return context;
}
