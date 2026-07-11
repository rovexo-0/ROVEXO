import type { AnnualStatement } from "@/lib/wallet/monthly-statements";

export type ComplianceExportRow = {
  year: string;
  sales: number;
  platformFees: number;
  refunds: number;
  withdrawals: number;
  endBalance: number;
};

export function buildHmrcExportRows(statements: AnnualStatement[]): ComplianceExportRow[] {
  return statements.map((statement) => ({
    year: statement.year,
    sales: statement.sales,
    platformFees: statement.platformFees,
    refunds: statement.refunds,
    withdrawals: statement.withdrawals,
    endBalance: statement.endBalance,
  }));
}

export function serializeComplianceCsv(rows: ComplianceExportRow[]): string {
  const header = "Year,Sales,Platform Fees,Refunds,Withdrawals,End Balance";
  const lines = rows.map(
    (row) =>
      `${row.year},${row.sales.toFixed(2)},${row.platformFees.toFixed(2)},${row.refunds.toFixed(2)},${row.withdrawals.toFixed(2)},${row.endBalance.toFixed(2)}`,
  );
  return [header, ...lines].join("\n");
}
