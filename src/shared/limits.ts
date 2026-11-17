// firestore.rules enforces the group name, description, member count and amount limits too, so keep both in step.
export const MAXIMUM_GROUP_NAME_LENGTH = 60;
export const MAXIMUM_MEMBER_NAME_LENGTH = 40;
export const MAXIMUM_DESCRIPTION_LENGTH = 80;
export const MAXIMUM_MEMBERS = 200;
export const MAXIMUM_AMOUNT_CENTS = 100_000_000_000;
