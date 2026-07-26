import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requirePermission } from "@/lib/api";
import { accountCreateSchema } from "@/lib/validations";

const SORTABLE = ["createdAt", "name", "industry"] as const;

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("read", "account");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const sortParam = searchParams.get("sort") ?? "createdAt";
    const sort = (SORTABLE as readonly string[]).includes(sortParam) ? sortParam : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.AccountWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { industry: { contains: q, mode: "insensitive" } },
        { billingCity: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.account.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ownedBy: { select: { id: true, name: true } },
          _count: { select: { contacts: true, opportunities: true } },
        },
      }),
      prisma.account.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requirePermission("create", "account");
    const data = await parseBody(request, accountCreateSchema);
    const account = await prisma.account.create({
      data: {
        name: data.name,
        industry: data.industry,
        website: data.website,
        phone: data.phone,
        billingCity: data.billingCity,
        employees: data.employees,
        ownedById: data.ownedById ?? user.id,
        createdById: user.id,
      },
    });
    return ok(account, 201);
  });
}
