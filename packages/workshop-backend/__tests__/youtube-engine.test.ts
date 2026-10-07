import { describe, expect, it } from "vitest";
import {
  ACADEMIC_DISCOVERY_CATALOG,
  extractYouTubeId,
  searchYouTubeLectures,
  handleYouTubeSearchRequest,
} from "../src/youtube-engine";

describe("Backend YouTube Engine", () => {
  it("curates verified academic lectures in catalog", () => {
    expect(ACADEMIC_DISCOVERY_CATALOG.length).toBeGreaterThanOrEqual(10);
    const vectorLecture = ACADEMIC_DISCOVERY_CATALOG.find(
      (l) => l.videoId === "fNk_zzaMoSs",
    );
    expect(vectorLecture).toBeDefined();
    expect(vectorLecture?.author).toBe("3Blue1Brown");
    expect(vectorLecture?.chapters.length).toBeGreaterThan(0);
    expect(vectorLecture?.takeaways.length).toBeGreaterThan(0);
  });

  describe("extractYouTubeId", () => {
    it("extracts from watch URL", () => {
      expect(
        extractYouTubeId("https://www.youtube.com/watch?v=kCc8FmEb1nY"),
      ).toBe("kCc8FmEb1nY");
    });

    it("extracts from youtu.be short URL", () => {
      expect(extractYouTubeId("https://youtu.be/ZK3O402wf1c")).toBe(
        "ZK3O402wf1c",
      );
    });

    it("extracts from query against catalog", () => {
      expect(extractYouTubeId("mit algorithms peak finding")).toBe(
        "HtSuA80QTyo",
      );
    });
  });

  describe("searchYouTubeLectures", () => {
    it("finds lectures for 'linear algebra'", () => {
      const results = searchYouTubeLectures("linear algebra");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.author === "3Blue1Brown")).toBe(true);
    });

    it("finds lectures for 'neural network' or 'gpt'", () => {
      const results = searchYouTubeLectures("neural network gpt");
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((r) => r.videoId === "aircAruvnKk" || r.videoId === "kCc8FmEb1nY"),
      ).toBe(true);
    });
  });

  describe("handleYouTubeSearchRequest", () => {
    it("returns 200 JSON with matched lectures", async () => {
      const req = new Request("https://voltrix.stream/api/youtube/search?q=calculus", {
        method: "GET",
      });
      const res = await handleYouTubeSearchRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json() as { success: boolean; results: unknown[] };
      expect(json.success).toBe(true);
      expect(json.results.length).toBeGreaterThan(0);
    });
  });
});
