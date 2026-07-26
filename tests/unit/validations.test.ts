import { describe, it, expect } from "vitest";
import {
  signupSchema,
  leadCreateSchema,
  opportunityCreateSchema,
  activityCreateSchema,
} from "@/lib/validations";

describe("Zod validation schemas", () => {
  it("signup requires a valid email and 8+ char password", () => {
    expect(signupSchema.safeParse({ name: "A", email: "bad", password: "short" }).success).toBe(false);
    const ok = signupSchema.safeParse({
      name: "Alice",
      email: "Alice@Example.com",
      password: "supersecret",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("alice@example.com"); // lowercased
  });

  it("lead requires first/last/company and defaults status to NEW", () => {
    const bad = leadCreateSchema.safeParse({ firstName: "", lastName: "X", company: "Y" });
    expect(bad.success).toBe(false);
    const ok = leadCreateSchema.safeParse({ firstName: "Jane", lastName: "Doe", company: "Acme" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.status).toBe("NEW");
  });

  it("lead rejects an invalid email but allows omitting it", () => {
    expect(leadCreateSchema.safeParse({ firstName: "J", lastName: "D", company: "A", email: "nope" }).success).toBe(false);
    const ok = leadCreateSchema.safeParse({ firstName: "J", lastName: "D", company: "A", email: "" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBeUndefined();
  });

  it("opportunity coerces amount and requires a close date", () => {
    const missing = opportunityCreateSchema.safeParse({ name: "Deal" });
    expect(missing.success).toBe(false);
    const ok = opportunityCreateSchema.safeParse({
      name: "Deal",
      amount: "5000",
      closeDate: "2026-01-01",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.amount).toBe(5000);
      expect(ok.data.stage).toBe("PROSPECTING");
      expect(ok.data.closeDate).toBeInstanceOf(Date);
    }
  });

  it("activity requires a subject and defaults type to TASK", () => {
    expect(activityCreateSchema.safeParse({ subject: "" }).success).toBe(false);
    const ok = activityCreateSchema.safeParse({ subject: "Call back" });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.type).toBe("TASK");
      expect(ok.data.completed).toBe(false);
    }
  });
});
