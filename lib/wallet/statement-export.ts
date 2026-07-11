import type { MonthlyStatement } from "@/lib/wallet/monthly-statements";

export function serializeMonthlyStatementCsv(statement: MonthlyStatement): string {
  const header = "Date,Label,Order,Type,Amount,Running Balance";
  const lines = statement.lines.map((line) =>
    [
      line.date,
      `"${line.label.replace(/"/g, '""')}"`,
      line.orderNumber ?? "",
      line.type,
      line.amount.toFixed(2),
      line.runningBalance.toFixed(2),
    ].join(","),
  );
  return [
    `Period,${statement.period}`,
    `Opening Balance,${statement.startBalance.toFixed(2)}`,
    `Closing Balance,${statement.endBalance.toFixed(2)}`,
    "",
    header,
    ...lines,
  ].join("\n");
}
