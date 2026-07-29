/**
 * When the first page fetched every DB match, eligible total === visible grid length.
 * Otherwise keep the DB total (pagination surfaces) until a full eligible recount runs.
 */
export function resolveEligibleVisibleTotal(input: {
  page: number;
  pageSize: number;
  dbTotal: number;
  rawRowCount: number;
  eligibleItemCount: number;
}): number {
  const from = (input.page - 1) * input.pageSize;
  const fetchedEntireMatchSet = from === 0 && input.rawRowCount >= input.dbTotal;
  return fetchedEntireMatchSet ? input.eligibleItemCount : input.dbTotal;
}
