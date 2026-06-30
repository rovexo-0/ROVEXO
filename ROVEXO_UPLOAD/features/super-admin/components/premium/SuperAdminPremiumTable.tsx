import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type SuperAdminPremiumTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
};

export function SuperAdminPremiumTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found.",
}: SuperAdminPremiumTableProps<T>) {
  if (rows.length === 0) {
    return <p className="sa-premium-empty">{emptyMessage}</p>;
  }

  return (
    <div className="sa-premium-table-wrap">
      <table className="sa-premium-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
