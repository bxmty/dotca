export interface PersonName {
  firstName?: string;
  lastName?: string;
}

/**
 * Split a single "full name" field into the first word and the rest, the
 * shape Resend contacts and the confirmation email's first name take. A part
 * that would be empty is left out rather than set to "".
 */
export function splitFullName(fullName: string): PersonName {
  const [firstName, ...otherNames] = fullName.trim().split(/\s+/);
  const lastName = otherNames.join(" ");
  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  };
}
