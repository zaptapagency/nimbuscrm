import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, parseBody, requirePermission } from "@/lib/api";
import { contactCreateSchema } from "@/lib/validations";

const SORTABLE = ["createdAt", "lastName", "firstName"] as const;

export async function GET(request: Request) {
  return handle(async () => {
    await requirePermission("read", "contact");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const accountId = searchParams.get("accountId")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const sortParam = searchParams.get("sort") ?? "createdAt";
    const sort = (SORTABLE as readonly string[]).includes(sortParam) ? sortParam : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.ContactWhereInput = {};
    if (accountId) where.accountId = accountId;
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          account: { select: { id: true, name: true } },
          ownedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requirePermission("create", "contact");
    const data = await parseBody(request, contactCreateSchema);
    const contact = await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        accountId: data.accountId,
        ownedById: data.ownedById ?? user.id,
        createdById: user.id,
      },
    });
    return ok(contact, 201);
  });
}
