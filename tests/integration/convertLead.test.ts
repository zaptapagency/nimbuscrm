import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { convertLead } from "@/lib/services/convertLead";
import { TEST_DATABASE_URL } from "../setup/globalSetup";

// Lazy-initialize Prisma Client after globalSetup has run.
// TEST_DATABASE_URL is evaluated at test execution time, not module load time.
let prisma: PrismaClient;

let userId: string;

async function makeLead() {
  return prisma.lead.create({
    data: {
      firstName: "Nina",
      lastName: "Prospect",
      company: "Prospect Co",
      email: "nina@prospect.co",
      phone: "555-9999",
      title: "VP",
      status: "QUALIFIED",
      ownedById: userId,
      createdById: userId,
    },
  });
}

beforeAll(async () => {
  // Initialize Prisma Client here, after globalSetup has prepared the test database.
  prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });

  const user = await prisma.user.create({
    data: {
      name: "Test Owner",
      email: "owner@test.local",
      passwordHash: "x",
      role: "SALES_REP",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.lead.deleteMany();
});

describe("convertLead transaction", () => {
  it("creates account + contact + opportunity and marks lead converted", async () => {
    const lead = await makeLead();
    const result = await convertLead(prisma, lead.id, userId, {
      createOpportunity: true,
      amount: 25000,
    });

    expect(result.accountId).toBeTruthy();
    expect(result.contactId).toBeTruthy();
    expect(result.opportunityId).toBeTruthy();

    const account = await prisma.account.findUnique({ where: { id: result.accountId } });
    const contact = await prisma.contact.findUnique({ where: { id: result.contactId } });
    const opp = await prisma.opportunity.findUnique({ where: { id: result.opportunityId! } });
    const updated = await prisma.lead.findUnique({ where: { id: lead.id } });

    expect(account?.name).toBe("Prospect Co");
    expect(contact?.accountId).toBe(account?.id);
    expect(opp?.amount).toBe(25000);
    expect(opp?.stage).toBe("PROSPECTING");
    expect(opp?.probability).toBe(10);
    expect(updated?.status).toBe("CONVERTED");
    expect(updated?.convertedAccountId).toBe(account?.id);
  });

  it("can convert without creating an opportunity", async () => {
    const lead = await makeLead();
    const result = await convertLead(prisma, lead.id, userId, { createOpportunity: false });
    expect(result.opportunityId).toBeNull();
    expect(await prisma.opportunity.count()).toBe(0);
    expect(await prisma.contact.count()).toBe(1);
  });

  it("refuses to convert an already-converted lead", async () => {
    const lead = await makeLead();
    await convertLead(prisma, lead.id, userId, { createOpportunity: false });
    await expect(
      convertLead(prisma, lead.id, userId, { createOpportunity: false }),
    ).rejects.toThrow("LEAD_ALREADY_CONVERTED");
  });

  it("is atomic: no partial records remain if conversion is re-attempted", async () => {
    const lead = await makeLead();
    await convertLead(prisma, lead.id, userId, { createOpportunity: true });
    // second attempt should throw and not create extra accounts/contacts
    await expect(
      convertLead(prisma, lead.id, userId, { createOpportunity: true }),
    ).rejects.toThrow();
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.opportunity.count()).toBe(1);
  });
});
