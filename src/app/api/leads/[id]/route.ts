import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { leadUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("read", "lead");
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        ownedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!lead) throw new ApiError(404, "Lead not found");
    return ok(lead);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "lead");
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Lead not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only edit leads you own");
    }
    const data = await parseBody(request, leadUpdateSchema);
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data,
    });
    return ok(lead);
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("delete", "lead");
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Lead not found");
    await prisma.lead.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  });
}
