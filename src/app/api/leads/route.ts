import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requirePermission } from "@/lib/api";
import { leadCreateSchema } from "@/lib/validations";

const SORTABLE = ["createdAt", "lastName", "company", "status"] as const;

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("read", "lead");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? 20)),
    );
    const sortParam = searchParams.get("sort") ?? "createdAt";
    const sort = (SORTABLE as readonly string[]).includes(sortParam)
      ? sortParam
      : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.LeadWhereInput = {};
    if (status) where.status = status as Prisma.LeadWhereInput["status"];
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { ownedBy: { select: { id: true, name: true } } },
      }),
      prisma.lead.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requirePermission("create", "lead");
    const data = await parseBody(request, leadCreateSchema);
    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        title: data.title,
        status: data.status,
        source: data.source,
        ownedById: data.ownedById ?? user.id,
        createdById: user.id,
      },
    });
    return ok(lead, 201);
  });
}
