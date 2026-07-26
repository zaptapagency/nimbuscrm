// SQLite (the zero-config default) does not support native Prisma enums, so
// these fields are stored as strings. These union types + constant arrays are
// the single source of truth for allowed values and are enforced by Zod at
// every API boundary.

export const ROLES = ["ADMIN", "MANAGER", "SALES_REP"] as const;
export type Role = (typeof ROLES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const OPPORTUNITY_STAGES = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const ACTIVITY_TYPES = ["TASK", "CALL", "MEETING", "NOTE"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
