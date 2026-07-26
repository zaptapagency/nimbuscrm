import { describe, it, expect } from "vitest";
import { can, canModifyRecord } from "@/lib/rbac";

describe("role-based access control", () => {
  it("admins can do everything including user management", () => {
    expect(can("ADMIN", "delete", "lead")).toBe(true);
    expect(can("ADMIN", "create", "user")).toBe(true);
    expect(can("ADMIN", "convert", "lead")).toBe(true);
  });

  it("managers have full CRM CRUD but cannot manage users", () => {
    expect(can("MANAGER", "delete", "opportunity")).toBe(true);
    expect(can("MANAGER", "read", "user")).toBe(true);
    expect(can("MANAGER", "create", "user")).toBe(false);
    expect(can("MANAGER", "delete", "user")).toBe(false);
  });

  it("sales reps cannot delete leads/accounts or manage users", () => {
    expect(can("SALES_REP", "read", "lead")).toBe(true);
    expect(can("SALES_REP", "create", "opportunity")).toBe(true);
    expect(can("SALES_REP", "convert", "lead")).toBe(true);
    expect(can("SALES_REP", "delete", "lead")).toBe(false);
    expect(can("SALES_REP", "delete", "account")).toBe(false);
    expect(can("SALES_REP", "read", "user")).toBe(false);
  });

  it("ownership: reps can only modify their own records", () => {
    const record = { ownedById: "user-1" };
    expect(canModifyRecord("SALES_REP", "user-1", record)).toBe(true);
    expect(canModifyRecord("SALES_REP", "user-2", record)).toBe(false);
  });

  it("ownership: admins and managers can modify any record", () => {
    const record = { ownedById: "user-1" };
    expect(canModifyRecord("ADMIN", "user-2", record)).toBe(true);
    expect(canModifyRecord("MANAGER", "user-2", record)).toBe(true);
  });
});
