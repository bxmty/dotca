/**
 * PLACEHOLDER for the Syncro lead write that bxmty/dotca#596-601 builds.
 *
 * Deliberately a stub that always throws: the real function's signature and
 * return shape are #596-601's to define, so nothing here guesses at them (the
 * parameter is `unknown` on purpose). Callers let the throw surface as their
 * normal "lead not recorded" failure. Replace this whole module with the real
 * implementation once #596-601 merges.
 */
export const createSyncroLead: (lead: unknown) => Promise<never> = async () => {
  throw new Error("not yet implemented — blocked on bxmty/dotca#596-601");
};
