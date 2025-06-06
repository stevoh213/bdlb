import { AIAnalysisService } from "../aiAnalysis";
import type { Session, LocalClimb } from "../../types/climbing";
import { strict as assert } from "node:assert";
import test from "node:test";

test("generateAnalysisPrompt includes optional fields", () => {
  const climbs: LocalClimb[] = [
    {
      id: "c1",
      name: "Problem A",
      grade: "V5",
      tickType: "send",
      timestamp: new Date("2024-01-01T10:10:00Z"),
      attempts: 2,
      effort: 8,
      height: 5,
      timeOnWall: 30,
      notes: "cruxy",
    },
  ];

  const session: Session = {
    id: "s1",
    location: "Gym A",
    climbingType: "boulder",
    gradeSystem: "V-Scale",
    notes: "Felt good",
    startTime: new Date("2024-01-01T10:00:00Z"),
    endTime: new Date("2024-01-01T12:00:00Z"),
    climbs,
    isActive: false,
    breaks: 2,
    totalBreakTime: 15,
  };

  const service = new AIAnalysisService("key");
  const prompt = (
    service as unknown as { generateAnalysisPrompt: (s: Session) => string }
  ).generateAnalysisPrompt(session);

  assert.match(prompt, /Grade system: V-Scale/);
  assert.match(prompt, /Notes: Felt good/);
  assert.match(prompt, /Breaks: 2/);
  assert.match(prompt, /Total break time: 15/);
  assert.match(prompt, /attempts 2/);
  assert.match(prompt, /effort 8\/10/);
  assert.match(prompt, /height 5m/);
  assert.match(prompt, /time on wall 30s/);
  assert.match(prompt, /notes: cruxy/);
});

test("generateAnalysisPrompt omits optional fields when absent", () => {
  const climbs: LocalClimb[] = [
    {
      id: "c2",
      name: "Route B",
      grade: "5.11a",
      tickType: "attempt",
      timestamp: new Date("2024-01-02T10:00:00Z"),
    },
  ];

  const session: Session = {
    id: "s2",
    location: "Gym B",
    climbingType: "sport",
    startTime: new Date("2024-01-02T10:00:00Z"),
    climbs,
    isActive: false,
    breaks: 0,
    totalBreakTime: 0,
  };

  const service = new AIAnalysisService("key");
  const prompt = (
    service as unknown as { generateAnalysisPrompt: (s: Session) => string }
  ).generateAnalysisPrompt(session);

  assert.ok(!prompt.includes("Grade system:"));
  assert.ok(!prompt.includes("Notes:"));
  assert.ok(!/attempts\s+\d/.test(prompt));
  assert.ok(!/height\s+\d/.test(prompt));
  assert.ok(!/time on wall/.test(prompt));
});
