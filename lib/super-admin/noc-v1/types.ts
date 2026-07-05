export type NocHealthStatus = "healthy" | "warning" | "critical" | "maintenance" | "offline";

export type NocHealthCard = {
  id: string;
  label: string;
  score: number;
  status: NocHealthStatus;
  detail?: string;
};

export type NocCriticalAlert = {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning";
  timestamp: string;
  href?: string;
};
