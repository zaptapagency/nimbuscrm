import type { OpportunityStage } from "@/lib/enums";

/**
 * Default win probability (%) for each opportunity stage.
 * Users can override probability manually, but changing stage resets it to
 * this default unless an explicit probability is supplied.
 */
export const STAGE_PROBABILITY: Record<OpportunityStage, number> = {
  PROSPECTING: 10,
  QUALIFICATION: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

export const STAGE_ORDER: OpportunityStage[] = [
  "PROSPECTING",
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  PROSPECTING: "Prospecting",
  QUALIFICATION: "Qualification",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export function defaultProbabilityForStage(stage: OpportunityStage): number {
  return STAGE_PROBABILITY[stage];
}

export function isClosedStage(stage: OpportunityStage): boolean {
  return stage === "CLOSED_WON" || stage === "CLOSED_LOST";
}

/**
 * Resolve the probability to persist given a stage and an optional explicit
 * value. Explicit values are clamped to 0..100; when absent the stage default
 * is used.
 */
export function resolveProbability(
  stage: OpportunityStage,
  explicit?: number | null,
): number {
  if (explicit === undefined || explicit === null) {
    return defaultProbabilityForStage(stage);
  }
  return Math.max(0, Math.min(100, Math.round(explicit)));
}
