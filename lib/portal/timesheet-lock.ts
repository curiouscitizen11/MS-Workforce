export function workerCanEditTimesheet(status: string | undefined) {
  return status !== "Approved"
}
