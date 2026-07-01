"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BuyerDashboardData, BuyerDashboardStatus } from "@/types/buyer";

type BuyerDashboardContextValue = {
  status: BuyerDashboardStatus;
  data: BuyerDashboardData;
  error?: string;
};

const BuyerDashboardContext = createContext<BuyerDashboardContextValue | null>(null);

type BuyerDashboardProviderProps = {
  data: BuyerDashboardData;
  status?: BuyerDashboardStatus;
  error?: string;
  children: ReactNode;
};

export function BuyerDashboardProvider({
  data,
  status = "success",
  error,
  children,
}: BuyerDashboardProviderProps) {
  return (
    <BuyerDashboardContext.Provider value={{ status, data, error }}>
      {children}
    </BuyerDashboardContext.Provider>
  );
}

export function useBuyerDashboard(): BuyerDashboardContextValue {
  const context = useContext(BuyerDashboardContext);
  if (!context) {
    throw new Error("useBuyerDashboard must be used within BuyerDashboardProvider");
  }
  return context;
}
