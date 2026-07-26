import type { Role } from "@/lib/enums";

export type Action = "read" | "create" | "update" | "delete" | "convert";
export type Resource =
  | "lead"
  | "account"
  | "contact"
  | "opportunity"
  | "activity"
  | "user";

/**
 * Central permission matrix. Enforced server-side in every API route.
 *
 * - ADMIN: everything.
 * - MANAGER: full CRUD on CRM objects (any owner), but no user management.
 * - SALES_REP: read all CRM objects; create anything; update/convert allowed
 *   (ownership is additionally checked in-route via canModifyRecord); cannot
 *   delete or manage users.
 */
const MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  ADMIN: {
    lead: ["read", "create", "update", "delete", "convert"],
    account: ["read", "create", "update", "delete"],
    contact: ["read", "create", "update", "delete"],
    opportunity: ["read", "create", "update", "delete"],
    activity: ["read", "create", "update", "delete"],
    user: ["read", "create", "update", "delete"],
  },
  MANAGER: {
    lead: ["read", "create", "update", "delete", "convert"],
    account: ["read", "create", "update", "delete"],
    contact: ["read", "create", "update", "delete"],
    opportunity: ["read", "create", "update", "delete"],
    activity: ["read", "create", "update", "delete"],
    user: ["read"],
  },
  SALES_REP: {
    lead: ["read", "create", "update", "convert"],
    account: ["read", "create", "update"],
    contact: ["read", "create", "update"],
    opportunity: ["read", "create", "update"],
    activity: ["read", "create", "update", "delete"],
    user: [],
  },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

/**
 * Ownership check used in addition to `can`. Admins and managers can modify any
 * record; sales reps can only modify records they own.
 */
export function canModifyRecord(
  role: Role,
  userId: string,
  record: { ownedById: string },
): boolean {
  if (role === "ADMIN" || role === "MANAGER") return true;
  return record.ownedById === userId;
}
