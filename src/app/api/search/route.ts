import { prisma } from "@/lib/prisma";
import { handle, ok, requireUser } from "@/lib/api";

export async function GET(request: Request) {
  return handle(async () => {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return ok({ leads: [], accounts: [], contacts: [], opportunities: [] });
    }

    const take = 5;
    const [leads, accounts, contacts, opportunities] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.account.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.opportunity.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return ok({
      leads: leads.map((l) => ({
        id: l.id,
        label: `${l.firstName} ${l.lastName} — ${l.company}`,
      })),
      accounts: accounts.map((a) => ({ id: a.id, label: a.name })),
      contacts: contacts.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
      })),
      opportunities: opportunities.map((o) => ({ id: o.id, label: o.name })),
    });
  });
}
