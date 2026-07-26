import { prisma } from "@/lib/prisma";
import { handle, ok, requireUser } from "@/lib/api";
import { STAGE_LABELS, STAGE_ORDER, isClosedStage } from "@/lib/stage";
import { quarterRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const { start, end } = quarterRange();

    const [opps, wonThisQuarter, leadTotals, topOpen, overdueTasks] =
      await Promise.all([
        prisma.opportunity.groupBy({
          by: ["stage"],
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.opportunity.aggregate({
          _sum: { amount: true },
          where: { stage: "CLOSED_WON", closeDate: { gte: start, lte: end } },
        }),
        prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.opportunity.findMany({
          where: { stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } },
          orderBy: { amount: "desc" },
          take: 5,
          include: { account: { select: { name: true } } },
        }),
        prisma.activity.findMany({
          where: {
            ownedById: user.id,
            completed: false,
            type: "TASK",
            dueDate: { lt: new Date() },
          },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
      ]);

    const pipelineByStage = STAGE_ORDER.filter((s) => !isClosedStage(s)).map(
      (stage) => {
        const row = opps.find((o) => o.stage === stage);
        return {
          stage,
          label: STAGE_LABELS[stage],
          value: row?._sum.amount ?? 0,
          count: row?._count._all ?? 0,
        };
      },
    );

    const openPipelineValue = pipelineByStage.reduce((s, r) => s + r.value, 0);

    const totalLeads = leadTotals.reduce((s, r) => s + r._count._all, 0);
    const convertedLeads =
      leadTotals.find((r) => r.status === "CONVERTED")?._count._all ?? 0;
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    return ok({
      pipelineByStage,
      openPipelineValue,
      wonThisQuarter: wonThisQuarter._sum.amount ?? 0,
      conversionRate,
      totalLeads,
      convertedLeads,
      topOpen: topOpen.map((o) => ({
        id: o.id,
        name: o.name,
        amount: o.amount,
        stage: o.stage,
        account: o.account?.name ?? null,
      })),
      overdueTasks: overdueTasks.map((t) => ({
        id: t.id,
        subject: t.subject,
        dueDate: t.dueDate,
      })),
    });
  });
}
