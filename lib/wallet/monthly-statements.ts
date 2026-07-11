import { createClient } from "@/lib/supabase/server";
import type { WalletTransaction } from "@/lib/wallet/types";

export type MonthlyStatementLine = {
  id: string;
  date: string;
  label: string;
  orderNumber: string | null;
  type: WalletTransaction["type"];
  amount: number;
  runningBalance: number;
};

export type MonthlyStatement = {
  period: string;
  label: string;
  startBalance: number;
  endBalance: number;
  sales: number;
  platformFees: number;
  refunds: number;
  withdrawals: number;
  lines: MonthlyStatementLine[];
};

function periodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function mapRow(row: {
  id: string;
  order_number: string | null;
  product_title: string;
  amount: number;
  type: WalletTransaction["type"];
  created_at: string;
}): Omit<MonthlyStatementLine, "runningBalance"> {
  return {
    id: row.id,
    date: row.created_at,
    label: row.product_title,
    orderNumber: row.order_number,
    type: row.type,
    amount: Number(row.amount),
  };
}

export async function buildMonthlyStatements(userId: string): Promise<MonthlyStatement[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("wallet_transactions")
    .select("id, order_number, product_title, amount, type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!rows?.length) return [];

  const byPeriod = new Map<string, Omit<MonthlyStatementLine, "runningBalance">[]>();
  for (const row of rows) {
    const key = periodKey(new Date(row.created_at));
    const bucket = byPeriod.get(key) ?? [];
    bucket.push(mapRow(row as Parameters<typeof mapRow>[0]));
    byPeriod.set(key, bucket);
  }

  const periods = [...byPeriod.keys()].sort();
  let rollingBalance = 0;
  const statements: MonthlyStatement[] = [];

  for (const period of periods) {
    const lines = byPeriod.get(period) ?? [];
    const startBalance = rollingBalance;

    let sales = 0;
    let platformFees = 0;
    let refunds = 0;
    let withdrawals = 0;

    const detailed: MonthlyStatementLine[] = [];
    for (const line of lines) {
      rollingBalance += line.amount;
      if (line.type === "sale") sales += line.amount;
      if (line.type === "fee") platformFees += Math.abs(line.amount);
      if (line.type === "refund") refunds += Math.abs(line.amount);
      if (line.type === "withdrawal") withdrawals += Math.abs(line.amount);
      detailed.push({ ...line, runningBalance: rollingBalance });
    }

    statements.push({
      period,
      label: periodLabel(period),
      startBalance,
      endBalance: rollingBalance,
      sales,
      platformFees,
      refunds,
      withdrawals,
      lines: detailed.reverse(),
    });
  }

  return statements.reverse();
}

export async function getMonthlyStatement(
  userId: string,
  period: string,
): Promise<MonthlyStatement | null> {
  const statements = await buildMonthlyStatements(userId);
  return statements.find((statement) => statement.period === period) ?? null;
}

export function sellerHasStatements(statements: MonthlyStatement[]): boolean {
  return statements.some(
    (statement) => statement.sales > 0 || statement.withdrawals > 0 || statement.refunds > 0,
  );
}

export type AnnualStatement = {
  year: string;
  label: string;
  startBalance: number;
  endBalance: number;
  sales: number;
  platformFees: number;
  refunds: number;
  withdrawals: number;
  months: MonthlyStatement[];
};

export function buildAnnualStatements(monthly: MonthlyStatement[]): AnnualStatement[] {
  const byYear = new Map<string, MonthlyStatement[]>();
  for (const statement of monthly) {
    const year = statement.period.split("-")[0];
    const bucket = byYear.get(year) ?? [];
    bucket.push(statement);
    byYear.set(year, bucket);
  }

  const years = [...byYear.keys()].sort();
  const annual: AnnualStatement[] = [];
  let rollingBalance = 0;

  for (const year of years) {
    const months = (byYear.get(year) ?? []).sort((a, b) => a.period.localeCompare(b.period));
    const startBalance = months.length ? months[0].startBalance : rollingBalance;
    let sales = 0;
    let platformFees = 0;
    let refunds = 0;
    let withdrawals = 0;

    for (const month of months) {
      sales += month.sales;
      platformFees += month.platformFees;
      refunds += month.refunds;
      withdrawals += month.withdrawals;
    }

    const endBalance = months.length ? months[months.length - 1].endBalance : startBalance;
    rollingBalance = endBalance;

    annual.push({
      year,
      label: year,
      startBalance,
      endBalance,
      sales,
      platformFees,
      refunds,
      withdrawals,
      months: [...months].reverse(),
    });
  }

  return annual.reverse();
}

export async function buildAnnualStatementsForUser(userId: string): Promise<AnnualStatement[]> {
  const monthly = await buildMonthlyStatements(userId);
  return buildAnnualStatements(monthly);
}

export async function getAnnualStatement(userId: string, year: string): Promise<AnnualStatement | null> {
  const annual = await buildAnnualStatementsForUser(userId);
  return annual.find((statement) => statement.year === year) ?? null;
}
