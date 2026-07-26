import { prisma } from "@/lib/prisma";
import {
  ApiError,
  handle,
  ok,
  parseBody,
  requirePermission,
} from "@/lib/api";
import { leadConvertSchema } from "@/lib/validations";
import { canModifyRecord } from "@/lib/rbac";
import { convertLead } from "@/lib/services/convertLead";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requirePermission("convert", "lead");
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Lead not found");
    if (!canModifyRecord(user.role, user.id, existing)) {
      throw new ApiError(403, "You can only convert leads you own");
    }

    const data = await parseBody(request, leadConvertSchema);
    try {
      const result = await convertLead(prisma, params.id, user.id, {
        createOpportunity: data.createOpportunity,
        opportunityName: data.opportunityName,
        amount: data.amount,
        closeDate: data.closeDate,
      });
      return ok(result, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "LEAD_ALREADY_CONVERTED") {
        throw new ApiError(409, "Lead has already been converted");
      }
      if (err instanceof Error && err.message === "LEAD_NOT_FOUND") {
        throw new ApiError(404, "Lead not found");
      }
      throw err;
    }
  });
}
