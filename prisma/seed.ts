import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STAGE_PROBABILITY } from "../src/lib/stage";

const prisma = new PrismaClient();

const OPPORTUNITY_STAGES = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;
const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED"] as const;
const LEAD_SOURCES = ["Web", "Referral", "Trade Show", "Cold Call", "Partner", "Email Campaign"];
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Manufacturing", "Retail", "Energy"];
const ACTIVITY_TYPES = ["TASK", "CALL", "MEETING", "NOTE"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding NimbusCRM…");

  // Clean existing data (idempotent re-seed)
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("Password123!", 10);
  const admin = await prisma.user.create({
    data: { name: "Alice Admin", email: "admin@nimbus.crm", passwordHash: password, role: "ADMIN" },
  });
  const manager = await prisma.user.create({
    data: { name: "Marcus Manager", email: "manager@nimbus.crm", passwordHash: password, role: "MANAGER" },
  });
  const rep = await prisma.user.create({
    data: { name: "Rita Rep", email: "rep@nimbus.crm", passwordHash: password, role: "SALES_REP" },
  });
  const users = [admin, manager, rep];

  // 25 leads
  const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "Sarah", "Chris", "Nancy", "Daniel", "Karen", "Paul", "Lisa", "Mark", "Betty", "Steven", "Sandra", "Kevin", "Ashley", "Brian", "Emily"];
  const companies = ["Acme Corp", "Globex", "Initech", "Umbrella Co", "Stark Industries", "Wayne Enterprises", "Wonka Inc", "Cyberdyne", "Soylent", "Hooli", "Pied Piper", "Vandelay", "Gekko & Co", "Prestige Worldwide", "Dunder Mifflin"];
  for (let i = 0; i < 25; i++) {
    await prisma.lead.create({
      data: {
        firstName: pick(firstNames, i),
        lastName: pick(firstNames, i + 7),
        company: pick(companies, i),
        email: `lead${i}@example.com`,
        phone: `555-01${String(i).padStart(2, "0")}`,
        title: pick(["CEO", "VP Sales", "CTO", "Buyer", "Director"], i),
        status: pick(LEAD_STATUSES, i),
        source: pick(LEAD_SOURCES, i),
        ownedById: pick(users, i).id,
        createdById: admin.id,
      },
    });
  }

  // 10 accounts
  const accountNames = ["Acme Corporation", "Globex Industries", "Initech LLC", "Umbrella Group", "Stark Industries", "Wayne Enterprises", "Wonka Industries", "Cyberdyne Systems", "Soylent Foods", "Hooli Inc"];
  const accounts = [];
  for (let i = 0; i < 10; i++) {
    accounts.push(
      await prisma.account.create({
        data: {
          name: pick(accountNames, i),
          industry: pick(INDUSTRIES, i),
          website: `https://www.${accountNames[i]!.split(" ")[0]!.toLowerCase()}.com`,
          phone: `555-02${String(i).padStart(2, "0")}`,
          billingCity: pick(["San Francisco", "New York", "Austin", "Chicago", "Seattle", "Boston"], i),
          employees: (i + 1) * 150,
          ownedById: pick(users, i).id,
          createdById: admin.id,
        },
      }),
    );
  }

  // 30 contacts across accounts
  const contacts = [];
  for (let i = 0; i < 30; i++) {
    const account = accounts[i % accounts.length]!;
    contacts.push(
      await prisma.contact.create({
        data: {
          firstName: pick(firstNames, i + 3),
          lastName: pick(firstNames, i + 11),
          email: `contact${i}@example.com`,
          phone: `555-03${String(i).padStart(2, "0")}`,
          title: pick(["Procurement", "Engineer", "CFO", "Operations", "Marketing Lead"], i),
          accountId: account.id,
          ownedById: account.ownedById,
          createdById: admin.id,
        },
      }),
    );
  }

  // 15 opportunities across stages
  const opps = [];
  for (let i = 0; i < 15; i++) {
    const account = accounts[i % accounts.length]!;
    const contact = contacts.find((c) => c.accountId === account.id) ?? contacts[i]!;
    const stage = pick(OPPORTUNITY_STAGES, i);
    opps.push(
      await prisma.opportunity.create({
        data: {
          name: `${account.name} - ${pick(["Platform", "Expansion", "Renewal", "Pilot", "Enterprise"], i)} Deal`,
          stage,
          amount: (i + 1) * 12500,
          probability: STAGE_PROBABILITY[stage],
          closeDate: daysFromNow(i * 7 - 14),
          accountId: account.id,
          contactId: contact.id,
          ownedById: account.ownedById,
          createdById: admin.id,
        },
      }),
    );
  }

  // 40 activities across records
  for (let i = 0; i < 40; i++) {
    const type = pick(ACTIVITY_TYPES, i);
    const owner = pick(users, i);
    const link: Record<string, string> = {};
    const mod = i % 4;
    if (mod === 0) link.opportunityId = pick(opps, i).id;
    else if (mod === 1) link.accountId = pick(accounts, i).id;
    else if (mod === 2) link.contactId = pick(contacts, i).id;
    // mod === 3 -> standalone task

    await prisma.activity.create({
      data: {
        type,
        subject: `${type === "TASK" ? "Follow up" : type === "CALL" ? "Discovery call" : type === "MEETING" ? "Demo meeting" : "Notes"} #${i + 1}`,
        description: type === "NOTE" ? "Captured during account review." : null,
        dueDate: type === "TASK" ? daysFromNow(i % 10 === 0 ? -3 : i - 5) : null,
        completed: i % 5 === 0,
        ownedById: owner.id,
        createdById: owner.id,
        ...link,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login credentials (password for all: Password123!):");
  console.log("  Admin:   admin@nimbus.crm");
  console.log("  Manager: manager@nimbus.crm");
  console.log("  Rep:     rep@nimbus.crm");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
