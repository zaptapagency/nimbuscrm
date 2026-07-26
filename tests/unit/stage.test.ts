import { describe, it, expect } from "vitest";
import {
  STAGE_PROBABILITY,
  defaultProbabilityForStage,
  isClosedStage,
  resolveProbability,
} from "@/lib/stage";

describe("stage probability logic", () => {
  it("maps each stage to its default probability", () => {
    expect(defaultProbabilityForStage("PROSPECTING")).toBe(10);
    expect(defaultProbabilityForStage("QUALIFICATION")).toBe(25);
    expect(defaultProbabilityForStage("PROPOSAL")).toBe(50);
    expect(defaultProbabilityForStage("NEGOTIATION")).toBe(75);
    expect(defaultProbabilityForStage("CLOSED_WON")).toBe(100);
    expect(defaultProbabilityForStage("CLOSED_LOST")).toBe(0);
  });

  it("identifies closed stages", () => {
    expect(isClosedStage("CLOSED_WON")).toBe(true);
    expect(isClosedStage("CLOSED_LOST")).toBe(true);
    expect(isClosedStage("PROPOSAL")).toBe(false);
  });

  it("uses stage default when no explicit probability given", () => {
    expect(resolveProbability("NEGOTIATION")).toBe(75);
    expect(resolveProbability("NEGOTIATION", null)).toBe(75);
    expect(resolveProbability("NEGOTIATION", undefined)).toBe(75);
  });

  it("honors an explicit probability, clamped to 0..100", () => {
    expect(resolveProbability("PROSPECTING", 42)).toBe(42);
    expect(resolveProbability("PROSPECTING", -10)).toBe(0);
    expect(resolveProbability("PROSPECTING", 150)).toBe(100);
    expect(resolveProbability("PROSPECTING", 33.7)).toBe(34);
  });

  it("keeps the probability table complete", () => {
    expect(Object.keys(STAGE_PROBABILITY)).toHaveLength(6);
  });
});
