import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { contactUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("read", "contact");
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        account: { select: { id: true, name: true } },
        ownedBy: { select: { id: true, name: true } },
        opportunities: { orderBy: { closeDate: "asc" } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { ownedBy: { select: { name: true } } },
        },
      },
    });
    if (!contact) throw new ApiError(404, "Contact not found");
    return ok(contact);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "contact");
    const existing = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Contact not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only edit contacts you own");
    }
    const data = await parseBody(request, contactUpdateSchema);
    const contact = await prisma.contact.update({ where: { id: params.id }, data });
    return ok(contact);
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("delete", "contact");
    const existing = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Contact not found");
    await prisma.contact.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  });
}
