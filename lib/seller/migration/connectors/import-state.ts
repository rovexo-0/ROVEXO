const cancelledImportJobs = new Set<string>();

export function markImportCancelled(jobId: string): void {
  cancelledImportJobs.add(jobId);
}

export function isImportCancelled(jobId: string): boolean {
  return cancelledImportJobs.has(jobId);
}

export function clearImportCancelled(jobId: string): void {
  cancelledImportJobs.delete(jobId);
}
