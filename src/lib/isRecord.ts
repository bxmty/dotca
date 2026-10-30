/** A plain object: narrowing for parsed JSON, whose shape can't be trusted. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
