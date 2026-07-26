import type { LeadStatus, OpportunityStage, ActivityType } from "@/lib/enums";
import { Badge } from "@/components/ui";
import { STAGE_LABELS } from "@/lib/stage";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const map: Record<LeadStatus, Parameters<typeof Badge>[0]["color"]> = {
    NEW: "blue",
    CONTACTED: "yellow",
    QUALIFIED: "green",
    UNQUALIFIED: "red",
    CONVERTED: "purple",
  };
  return <Badge color={map[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  const map: Record<OpportunityStage, Parameters<typeof Badge>[0]["color"]> = {
    PROSPECTING: "gray",
    QUALIFICATION: "blue",
    PROPOSAL: "yellow",
    NEGOTIATION: "purple",
    CLOSED_WON: "green",
    CLOSED_LOST: "red",
  };
  return <Badge color={map[stage]}>{STAGE_LABELS[stage]}</Badge>;
}

export function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const map: Record<ActivityType, Parameters<typeof Badge>[0]["color"]> = {
    TASK: "blue",
    CALL: "green",
    MEETING: "purple",
    NOTE: "gray",
  };
  return <Badge color={map[type]}>{type.charAt(0) + type.slice(1).toLowerCase()}</Badge>;
}
