import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { accountUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("read", "account");
    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        ownedBy: { select: { id: true, name: true } },
        contacts: { orderBy: { lastName: "asc" } },
        opportunities: { orderBy: { closeDate: "asc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { ownedBy: { select: { name: true } } },
        },
      },
    });
    if (!account) throw new ApiError(404, "Account not found");
    return ok(account);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "account");
    const existing = await prisma.account.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Account not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only edit accounts you own");
    }
    const data = await parseBody(request, accountUpdateSchema);
    const account = await prisma.account.update({ where: { id: params.id }, data });
    return ok(account);
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("delete", "account");
    const existing = await prisma.account.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Account not found");
    await prisma.account.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  });
}
