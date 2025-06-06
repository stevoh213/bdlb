import { describe, expect, it } from "vitest";
import type { LocalClimb, Session } from "../../types/climbing";
import { AIAnalysisService } from "../aiAnalysis";

describe("AIAnalysisService", () => {
  describe("generateAnalysisPrompt", () => {
    it("includes optional fields when they are present", () => {
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
          physicalSkills: ["dynamic"],
          technicalSkills: ["heel hook"],
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

      expect(prompt).toContain("Grade system: V-Scale");
      expect(prompt).toContain("Notes: Felt good");
      expect(prompt).toContain("Breaks taken: 2 (total 15 minutes)");
      expect(prompt).toContain("effort 8/10");
      expect(prompt).toContain("height 5m");
      expect(prompt).toContain("time on wall 30s");
      expect(prompt).toContain("notes: cruxy");
      expect(prompt).toContain("physical skills: dynamic");
      expect(prompt).toContain("technical skills: heel hook");
    });

    it("omits optional fields when they are absent", () => {
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
        endTime: new Date("2024-01-02T10:00:00Z"), // duration 0
        climbs,
        isActive: false,
        breaks: undefined,
        totalBreakTime: undefined,
      };

      const service = new AIAnalysisService("key");
      const prompt = (
        service as unknown as { generateAnalysisPrompt: (s: Session) => string }
      ).generateAnalysisPrompt(session);

      expect(prompt).not.toContain("Grade system:");
      expect(prompt).not.toContain("Notes:");
      expect(prompt).not.toContain("Breaks taken:");
      expect(prompt).not.toMatch(/, effort \d\/10/);
      expect(prompt).not.toContain("height");
      expect(prompt).not.toContain("time on wall");
      expect(prompt).not.toContain("physical skills");
      expect(prompt).not.toContain("technical skills");
    });
  });
});
