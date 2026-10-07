// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  extractYouTubeId,
  ACADEMIC_DISCOVERY_CATALOG,
  YouTubePlayerCard,
  YouTubeChatCard,
} from "./YouTubePlayerCard";
import { MarkdownMessage } from "../../ChatInterface";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("YouTube Engine and YouTubePlayerCard", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function render(element: React.ReactElement) {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(element));
  }

  describe("extractYouTubeId", () => {
    it("extracts ID from standard watch URL", () => {
      expect(
        extractYouTubeId("https://www.youtube.com/watch?v=fNk_zzaMoSs"),
      ).toBe("fNk_zzaMoSs");
    });

    it("extracts ID from short youtu.be URL", () => {
      expect(extractYouTubeId("https://youtu.be/kCc8FmEb1nY")).toBe(
        "kCc8FmEb1nY",
      );
    });

    it("extracts ID from direct 11-char ID", () => {
      expect(extractYouTubeId("ZK3O402wf1c")).toBe("ZK3O402wf1c");
    });

    it("extracts ID from JSON object or string", () => {
      expect(
        extractYouTubeId(JSON.stringify({ videoId: "aircAruvnKk" })),
      ).toBe("aircAruvnKk");
    });

    it("falls back to academic catalog on topical search query", () => {
      const match = extractYouTubeId("essence of linear algebra vectors");
      expect(match).toBe("fNk_zzaMoSs");
    });
  });

  describe("YouTubePlayerCard component rendering", () => {
    it("renders iframe with nocookie domain and lecture title", async () => {
      await render(
        createElement(YouTubePlayerCard, {
          videoId: "fNk_zzaMoSs",
          title: "Vectors, what even are they?",
          author: "3Blue1Brown",
        }),
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toContain(
        "https://www.youtube-nocookie.com/embed/fNk_zzaMoSs",
      );
      expect(container.textContent).toContain("Vectors, what even are they?");
      expect(container.textContent).toContain("3Blue1Brown");
    });

    it("renders chapter navigation timestamps from catalog", async () => {
      await render(
        createElement(YouTubePlayerCard, {
          videoId: "fNk_zzaMoSs",
        }),
      );

      const chapterBtn = container.querySelector(
        'button[title="Toggle lecture chapters and takeaways"]',
      );
      expect(chapterBtn).not.toBeNull();

      // Timestamps exist in catalog
      expect(container.textContent).toContain("00:00");
      expect(container.textContent).toContain("01:25");
    });
  });

  describe("YouTubeChatCard component", () => {
    it("renders thumbnail and watch button", async () => {
      await render(
        createElement(YouTubeChatCard, {
          data: {
            videoId: "kCc8FmEb1nY",
            title: "Let's build GPT",
            author: "Andrej Karpathy",
          },
        }),
      );

      const img = container.querySelector("img");
      expect(img?.getAttribute("src")).toContain("kCc8FmEb1nY");
      expect(container.textContent).toContain("Let's build GPT");
      expect(container.textContent).toContain("Watch");
    });
  });

  describe("MarkdownMessage integration", () => {
    it("renders interactive YouTubePlayerCard from ```youtube code block", async () => {
      const markdown = "Here is a great lecture:\n\n```youtube\nhttps://www.youtube.com/watch?v=fNk_zzaMoSs\n```";
      await render(createElement(MarkdownMessage, { message: markdown }));

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toContain(
        "https://www.youtube-nocookie.com/embed/fNk_zzaMoSs",
      );
    });

    it("renders interactive YouTubePlayerCard from markdown link", async () => {
      const markdown = "Check out [🎬 Linear Combinations](https://www.youtube.com/watch?v=k7RM-ot2NWY)";
      await render(createElement(MarkdownMessage, { message: markdown }));

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toContain(
        "https://www.youtube-nocookie.com/embed/k7RM-ot2NWY",
      );
      expect(container.textContent).toContain("Linear Combinations");
    });
  });
});
