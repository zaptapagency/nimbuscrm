import type { PrismaClient, Prisma } from "@prisma/client";
import { resolveProbability } from "@/lib/stage";

export type ConvertLeadOptions = {
  createOpportunity: boolean;
  opportunityName?: string;
  amount?: number;
  closeDate?: Date;
};

export type ConvertLeadResult = {
  accountId: string;
  contactId: string;
  opportunityId: string | null;
};

/**
 * Convert a lead into an Account + Contact (+ optional Opportunity) atomically.
 *
 * Runs inside a single transaction so a partial failure never leaves a
 * half-converted lead. Idempotency: throws if the lead is already converted.
 */
export async function convertLead(
  db: PrismaClient,
  leadId: string,
  actingUserId: string,
  options: ConvertLeadOptions,
): Promise<ConvertLeadResult> {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new Error("LEAD_NOT_FOUND");
    }
    if (lead.status === "CONVERTED" || lead.convertedContactId) {
      throw new Error("LEAD_ALREADY_CONVERTED");
    }

    const ownerId = lead.ownedById;

    const account = await tx.account.create({
      data: {
        name: lead.company,
        phone: lead.phone,
        ownedById: ownerId,
        createdById: actingUserId,
      },
    });

    const contact = await tx.contact.create({
      data: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        accountId: account.id,
        ownedById: ownerId,
        createdById: actingUserId,
      },
    });

    let opportunityId: string | null = null;
    if (options.createOpportunity) {
      const closeDate =
        options.closeDate ??
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const opp = await tx.opportunity.create({
        data: {
          name:
            options.opportunityName?.trim() ||
            `${lead.company} - New Business`,
          stage: "PROSPECTING",
          amount: options.amount ?? 0,
          probability: resolveProbability("PROSPECTING"),
          closeDate,
          accountId: account.id,
          contactId: contact.id,
          ownedById: ownerId,
          createdById: actingUserId,
        },
      });
      opportunityId = opp.id;
    }

    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedAccountId: account.id,
        convertedContactId: contact.id,
        convertedOpportunityId: opportunityId,
      },
    });

    return { accountId: account.id, contactId: contact.id, opportunityId };
  });
}
