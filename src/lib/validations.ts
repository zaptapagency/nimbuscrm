import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "MANAGER", "SALES_REP"]);
export const leadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
]);
export const stageEnum = z.enum([
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);
export const activityTypeEnum = z.enum(["TASK", "CALL", "MEETING", "NOTE"]);

const optionalString = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

const optionalEmail = z
  .string()
  .trim()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

// ---- Auth ----
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: roleEnum.optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// ---- Lead ----
export const leadCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  company: z.string().trim().min(1, "Company is required").max(160),
  email: optionalEmail,
  phone: optionalString,
  title: optionalString,
  status: leadStatusEnum.default("NEW"),
  source: optionalString,
  ownedById: z.string().trim().min(1).optional(),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadConvertSchema = z.object({
  createOpportunity: z.boolean().default(true),
  opportunityName: z.string().trim().max(160).optional(),
  amount: z.coerce.number().min(0).optional(),
  closeDate: z.coerce.date().optional(),
});
export type LeadConvertInput = z.infer<typeof leadConvertSchema>;

// ---- Account ----
export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  industry: optionalString,
  website: optionalString,
  phone: optionalString,
  billingCity: optionalString,
  employees: z.coerce.number().int().min(0).optional(),
  ownedById: z.string().trim().min(1).optional(),
});
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export const accountUpdateSchema = accountCreateSchema.partial();

// ---- Contact ----
export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: optionalEmail,
  phone: optionalString,
  title: optionalString,
  accountId: z.string().trim().min(1).optional(),
  ownedById: z.string().trim().min(1).optional(),
});
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export const contactUpdateSchema = contactCreateSchema.partial();

// ---- Opportunity ----
export const opportunityCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  stage: stageEnum.default("PROSPECTING"),
  amount: z.coerce.number().min(0, "Amount cannot be negative").default(0),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  closeDate: z.coerce.date(),
  accountId: z.string().trim().min(1).optional(),
  contactId: z.string().trim().min(1).optional(),
  ownedById: z.string().trim().min(1).optional(),
});
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export const opportunityUpdateSchema = opportunityCreateSchema.partial();

export const stageUpdateSchema = z.object({ stage: stageEnum });

// ---- Activity ----
export const activityCreateSchema = z
  .object({
    type: activityTypeEnum.default("TASK"),
    subject: z.string().trim().min(1, "Subject is required").max(200),
    description: optionalString,
    dueDate: z.coerce.date().optional(),
    completed: z.boolean().default(false),
    leadId: z.string().trim().min(1).optional(),
    contactId: z.string().trim().min(1).optional(),
    accountId: z.string().trim().min(1).optional(),
    opportunityId: z.string().trim().min(1).optional(),
    ownedById: z.string().trim().min(1).optional(),
  });
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export const activityUpdateSchema = activityCreateSchema.partial();
