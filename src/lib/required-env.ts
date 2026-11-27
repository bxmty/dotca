/**
 * Read a set of environment variables that must all be set (non-empty) for
 * a best-effort integration to run. The missing names, never the values,
 * come back for the caller's PII- and secret-free failure message.
 */
export type RequiredEnvResult<Name extends string> =
  | { isComplete: true; valuesByName: Record<Name, string> }
  | { isComplete: false; missingNames: Name[] };

export function readRequiredEnv<Name extends string>(
  names: readonly Name[],
): RequiredEnvResult<Name> {
  const missingNames = names.filter((name) => !process.env[name]);
  if (missingNames.length > 0) {
    return { isComplete: false, missingNames };
  }
  const valuesByName = Object.fromEntries(
    names.map((name) => [name, process.env[name] as string]),
  ) as Record<Name, string>;
  return { isComplete: true, valuesByName };
}

/** "A, B not set": the shared wording for a missing-env failure detail. */
export function describeMissingEnv(missingNames: readonly string[]): string {
  return `${missingNames.join(", ")} not set`;
}
