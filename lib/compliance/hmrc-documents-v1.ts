/**
 * HMRC document builders — seller-scoped Sales Summary / Annual Report / CSV export.
 * Minimal PDF (no third-party dependency).
 */

import { formatGbp, type HmrcPrefillField, type HmrcSellerCounters } from "@/lib/compliance/hmrc-engine-v1";

export type HmrcDocumentKind = "sales_summary" | "annual_report" | "hmrc_export";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Minimal single-page PDF from plain text lines. */
export function buildSimplePdf(lines: string[]): Uint8Array {
  const contentLines = lines.flatMap((line, index) => {
    const y = 800 - index * 16;
    return [`BT /F1 11 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`];
  });
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  }
  const xref = offsets.length - 1;
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${xref + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= xref; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${xref + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function buildSalesSummaryPdf(input: {
  counters: HmrcSellerCounters;
  sellerName: string;
  generatedAt?: Date;
}): Uint8Array {
  const at = input.generatedAt ?? new Date();
  return buildSimplePdf([
    "ROVEXO — HMRC Sales Summary",
    `Tax year: ${input.counters.currentTaxYear}`,
    `Seller: ${input.sellerName}`,
    `Generated: ${at.toISOString()}`,
    "",
    `Completed sales: ${input.counters.completedSales}`,
    `Gross sales: ${formatGbp(input.counters.grossSales)}`,
    `Reporting threshold: ${formatGbp(input.counters.threshold)}`,
    `Progress: ${input.counters.percentage}%`,
    `Remaining to threshold: ${formatGbp(input.counters.remainingToThreshold)}`,
    `Report required: ${input.counters.reportRequired ? "Yes" : "No"}`,
    "",
    "Figures are derived from your ROVEXO completed sales for this tax year.",
    "This document is not personal tax advice.",
  ]);
}

export function buildAnnualReportPdf(input: {
  counters: HmrcSellerCounters;
  prefill: HmrcPrefillField[];
  statusTitle: string;
  sellerName: string;
  generatedAt?: Date;
}): Uint8Array {
  const at = input.generatedAt ?? new Date();
  const lines = [
    "ROVEXO — HMRC Annual Report",
    `Tax year: ${input.counters.currentTaxYear}`,
    `Seller: ${input.sellerName}`,
    `Generated: ${at.toISOString()}`,
    `Status: ${input.statusTitle}`,
    "",
    "Activity",
    `Completed sales: ${input.counters.completedSales}`,
    `Gross sales: ${formatGbp(input.counters.grossSales)}`,
    `Threshold: ${formatGbp(input.counters.threshold)}`,
    `Percentage: ${input.counters.percentage}%`,
    `Next report due: ${input.counters.nextReportDue ?? "Not applicable"}`,
    "",
    "Seller information",
    ...input.prefill.map((field) => `${field.label}: ${field.value}`),
    "",
    "ROVEXO reports seller information to HMRC only where required by UK law.",
  ];
  return buildSimplePdf(lines);
}

export function buildHmrcExportCsv(input: {
  counters: HmrcSellerCounters;
  prefill: HmrcPrefillField[];
}): string {
  const rows = [
    ["Field", "Value"],
    ["Tax year", input.counters.currentTaxYear],
    ["Completed sales", String(input.counters.completedSales)],
    ["Gross sales GBP", input.counters.grossSales.toFixed(2)],
    ["Threshold GBP", input.counters.threshold.toFixed(2)],
    ["Percentage", String(input.counters.percentage)],
    ["Report required", input.counters.reportRequired ? "yes" : "no"],
    ["Number of reports", String(input.counters.numberOfReports)],
    ["Last report", input.counters.lastReport ?? ""],
    ["Next report due", input.counters.nextReportDue ?? ""],
    ...input.prefill.map((field) => [field.label, field.value]),
  ];
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function hmrcDocumentFilename(
  kind: HmrcDocumentKind,
  taxYearLabel: string,
): string {
  const slug = taxYearLabel.replace("/", "-");
  if (kind === "sales_summary") return `rovexo-hmrc-sales-summary-${slug}.pdf`;
  if (kind === "annual_report") return `rovexo-hmrc-annual-report-${slug}.pdf`;
  return `rovexo-hmrc-export-${slug}.csv`;
}
