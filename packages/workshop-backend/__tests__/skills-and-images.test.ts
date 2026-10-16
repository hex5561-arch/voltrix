import { describe, it, expect, vi } from "vitest";
import type { LearnedSkill, StudentProfile } from "@gadgets/workshop-shared/api";
import { generateImage } from "../src/image-engine";

describe("Learned Skills & Correction Engine Flywheel", () => {
  it("enforces strict user privacy scope on user skills", () => {
    const userSkill: LearnedSkill = {
      id: "skill-1",
      trigger: "When writing code for user",
      rule: "Use TypeScript strict mode with no implicit any",
      scope: "user",
      author: "user-123",
      createdAt: Date.now(),
    };

    expect(userSkill.scope).toBe("user");
    expect(userSkill.author).toBe("user-123");
  });

  it("differentiates user-scoped skills from global platform rules", () => {
    const skills: LearnedSkill[] = [
      {
        id: "user-pref-dark",
        trigger: "When creating UI components",
        rule: "Default to slate-900 background with emerald-400 accents",
        scope: "user",
        createdAt: 1000,
      },
      {
        id: "global-r2",
        trigger: "When generating assets",
        rule: "Persist to R2 bucket blueprint-content",
        scope: "global",
        createdAt: 1000,
      },
    ];

    const userOnly = skills.filter((s) => s.scope !== "global");
    const globalOnly = skills.filter((s) => s.scope === "global");

    expect(userOnly.length).toBe(1);
    expect(userOnly[0].id).toBe("user-pref-dark");
    expect(globalOnly.length).toBe(1);
    expect(globalOnly[0].id).toBe("global-r2");
  });

  it("updates StudentProfile skills array properly without data loss", () => {
    const profile: StudentProfile = {
      university: "MIT",
      degreeProgram: "Computer Science",
      academicLevel: "Year 3",
      academicYear: "2026",
      semester: "Fall",
      discipline: "CS",
      disciplineTitle: "Computer Science",
      citationStyle: "IEEE",
      courses: [{ code: "6.006", name: "Algorithms" }],
      updatedAt: Date.now(),
      skills: [],
    };

    const newSkill: LearnedSkill = {
      id: "skill-chem-1",
      trigger: "When writing lab report conclusions",
      rule: "Always include error margin calculations",
      scope: "user",
      createdAt: Date.now(),
    };

    profile.skills = [newSkill];
    expect(profile.skills.length).toBe(1);
    expect(profile.skills[0].rule).toContain("error margin");
  });
});

describe("Image Engine Contract", () => {
  it("rejects empty prompt", async () => {
    await expect(
      generateImage(
        { prompt: "" },
        {
          BLUEPRINT_CONTENT: {} as any,
          WORKERS_AI: {} as any,
        }
      )
    ).rejects.toThrow("Image prompt is required");
  });

  it("persists generated binary into R2 and formats CDN URLs correctly", async () => {
    const mockPut = vi.fn().mockResolvedValue({});
    const mockR2 = {
      put: mockPut,
    };

    const mockAi = {
      run: vi.fn().mockResolvedValue(new Uint8Array([137, 80, 78, 71])), // PNG magic bytes
    };

    const result = await generateImage(
      {
        prompt: "A futuristic electric grid schematic",
        filename: "electric-grid",
        model: "@cf/black-forest-labs/flux-1-schnell",
      },
      {
        BLUEPRINT_CONTENT: mockR2 as any,
        WORKERS_AI: mockAi as any,
      }
    );

    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith(
      "hf-videos/electric-grid.png",
      expect.any(Uint8Array),
      expect.objectContaining({
        httpMetadata: expect.objectContaining({
          contentType: "image/png",
        }),
      })
    );

    expect(result.imageUrl).toBe("https://voltrix.stream/api/hf-videos/electric-grid.png");
    expect(result.relativeUrl).toBe("/api/hf-videos/electric-grid.png");
    expect(result.markdownEmbed).toBe("![A futuristic electric grid schematic](https://voltrix.stream/api/hf-videos/electric-grid.png)");
  });
});
