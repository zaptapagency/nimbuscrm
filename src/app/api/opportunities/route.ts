import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requirePermission } from "@/lib/api";
import { opportunityCreateSchema } from "@/lib/validations";
import { resolveProbability } from "@/lib/stage";

const SORTABLE = ["createdAt", "name", "amount", "closeDate", "stage"] as const;

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("read", "opportunity");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const stage = searchParams.get("stage")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const sortParam = searchParams.get("sort") ?? "closeDate";
    const sort = (SORTABLE as readonly string[]).includes(sortParam) ? sortParam : "closeDate";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const where: Prisma.OpportunityWhereInput = {};
    if (stage) where.stage = stage as Prisma.OpportunityWhereInput["stage"];
    if (q) where.name = { contains: q, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          account: { select: { id: true, name: true } },
          ownedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requirePermission("create", "opportunity");
    const data = await parseBody(request, opportunityCreateSchema);
    const opportunity = await prisma.opportunity.create({
      data: {
        name: data.name,
        stage: data.stage,
        amount: data.amount,
        probability: resolveProbability(data.stage, data.probability),
        closeDate: data.closeDate,
        accountId: data.accountId,
        contactId: data.contactId,
        ownedById: data.ownedById ?? user.id,
        createdById: user.id,
      },
    });
    return ok(opportunity, 201);
  });
}
