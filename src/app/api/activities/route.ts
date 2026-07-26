import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requirePermission } from "@/lib/api";
import { activityCreateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requirePermission("read", "activity");
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // "mine" | undefined
    const completedParam = searchParams.get("completed");
    const leadId = searchParams.get("leadId")?.trim();
    const contactId = searchParams.get("contactId")?.trim();
    const accountId = searchParams.get("accountId")?.trim();
    const opportunityId = searchParams.get("opportunityId")?.trim();

    const where: Prisma.ActivityWhereInput = {};
    if (scope === "mine") where.ownedById = user.id;
    if (completedParam === "true") where.completed = true;
    if (completedParam === "false") where.completed = false;
    if (leadId) where.leadId = leadId;
    if (contactId) where.contactId = contactId;
    if (accountId) where.accountId = accountId;
    if (opportunityId) where.opportunityId = opportunityId;

    const items = await prisma.activity.findMany({
      where,
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        ownedBy: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        account: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });
    return ok({ items, total: items.length });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requirePermission("create", "activity");
    const data = await parseBody(request, activityCreateSchema);
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        subject: data.subject,
        description: data.description,
        dueDate: data.dueDate,
        completed: data.completed,
        leadId: data.leadId,
        contactId: data.contactId,
        accountId: data.accountId,
        opportunityId: data.opportunityId,
        ownedById: data.ownedById ?? user.id,
        createdById: user.id,
      },
    });
    return ok(activity, 201);
  });
}
