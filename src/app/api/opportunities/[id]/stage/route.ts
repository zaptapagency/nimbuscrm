import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { stageUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";
import { resolveProbability } from "@/lib/stage";

type Params = { params: { id: string } };

// Dedicated endpoint used by the Kanban board's drag-and-drop. Moving a card
// resets probability to the target stage's default.
export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "opportunity");
    const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Opportunity not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only move opportunities you own");
    }
    const { stage } = await parseBody(request, stageUpdateSchema);
    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: { stage, probability: resolveProbability(stage) },
    });
    return ok(opportunity);
  });
}
