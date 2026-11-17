// "Created the group" is logged under the creator's name, which is only known
// once they pick who they are right after creating it.
// A group created here also needs no wait for its expenses: it has none yet.

const groupIdsCreatedHere = new Set<string>();

export function markCreatedHere(groupId: string) {
  groupIdsCreatedHere.add(groupId);
}

export function isCreatedHere(groupId: string): boolean {
  return groupIdsCreatedHere.has(groupId);
}

/** True once per created group, so the creation is logged a single time. */
export function consumeCreatedHere(groupId: string): boolean {
  return groupIdsCreatedHere.delete(groupId);
}
