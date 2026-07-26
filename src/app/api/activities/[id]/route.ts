import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { activityUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "activity");
    const existing = await prisma.activity.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Activity not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only edit activities you own");
    }
    const data = await parseBody(request, activityUpdateSchema);
    const activity = await prisma.activity.update({ where: { id: params.id }, data });
    return ok(activity);
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("delete", "activity");
    const existing = await prisma.activity.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Activity not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only delete activities you own");
    }
    await prisma.activity.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  });
}
