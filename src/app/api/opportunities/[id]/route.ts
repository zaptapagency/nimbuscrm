import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { opportunityUpdateSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";
import { resolveProbability } from "@/lib/stage";
import type { OpportunityStage } from "@/lib/enums";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("read", "opportunity");
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        ownedBy: { select: { id: true, name: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { ownedBy: { select: { name: true } } },
        },
      },
    });
    if (!opportunity) throw new ApiError(404, "Opportunity not found");
    return ok(opportunity);
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("update", "opportunity");
    const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Opportunity not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only edit opportunities you own");
    }
    const data = await parseBody(request, opportunityUpdateSchema);

    // If the stage changed and no explicit probability was supplied, reset the
    // probability to the new stage's default. If probability is supplied, honor
    // it (clamped).
    let probability = data.probability ?? undefined;
    if (data.stage && data.stage !== existing.stage && data.probability === undefined) {
      probability = resolveProbability(data.stage);
    } else if (data.probability !== undefined) {
      const stage = data.stage ?? (existing.stage as OpportunityStage);
      probability = resolveProbability(stage, data.probability);
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: { ...data, probability },
    });
    return ok(opportunity);
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return handle(async () => {
    await requirePermission("delete", "opportunity");
    const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Opportunity not found");
    await prisma.opportunity.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  });
}
