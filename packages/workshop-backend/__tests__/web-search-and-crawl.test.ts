import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  decodeDuckDuckGoUrl,
  cleanHtmlText,
  searchDuckDuckGo,
  searchWikipedia,
  webSearch,
  formatWebSearchResult,
} from "../src/web-search";
import {
  extractOutboundLinks,
  webCrawl,
  formatWebCrawlResult,
} from "../src/web-crawl";

describe("WebSearch Engine", () => {
  describe("decodeDuckDuckGoUrl", () => {
    it("decodes uddg redirect parameter correctly", () => {
      const raw = "//duckduckgo.com/l/?uddg=https%3A%2F%2Fcloudflare.com%2Fworkers&rut=abc";
      const decoded = decodeDuckDuckGoUrl(raw);
      expect(decoded).toBe("https://cloudflare.com/workers");
    });

    it("passes through standard https URLs directly", () => {
      const raw = "https://voltrix.stream/about";
      expect(decodeDuckDuckGoUrl(raw)).toBe("https://voltrix.stream/about");
    });

    it("handles invalid or empty strings gracefully", () => {
      expect(decodeDuckDuckGoUrl("")).toBe("");
    });
  });

  describe("cleanHtmlText", () => {
    it("strips HTML tags and script blocks", () => {
      const dirty = "<div><script>alert(1)</script>Hello <b>World</b> &amp; Voltrix!</div>";
      expect(cleanHtmlText(dirty)).toBe("Hello World & Voltrix!");
    });
  });

  describe("webSearch fallback and formatting", () => {
    it("searches and returns structured results with formatting", async () => {
      // Mock global fetch for DuckDuckGo
      const mockDdgHtml = `
        <div class="result results_links results_links_deep web-result">
          <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Freact.dev">React Home</a>
          <h2 class="result__title"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Freact.dev">React - The library for web and native UIs</a></h2>
          <a class="result__snippet">The library for web and native user interfaces. Build user interfaces out of individual pieces called components.</a>
        </div>
      `;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockDdgHtml,
        json: async () => [],
      } as any);

      try {
        const res = await webSearch({ query: "React UI", maxResults: 5 });
        expect(res.query).toBe("React UI");
        expect(res.results.length).toBeGreaterThan(0);
        expect(res.results[0].title).toContain("React");
        expect(res.results[0].url).toBe("https://react.dev");

        const formatted = formatWebSearchResult(res);
        expect(formatted).toContain("### Web Search Results: \"React UI\"");
        expect(formatted).toContain("[React - The library for web and native UIs](https://react.dev)");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("handles empty queries gracefully", async () => {
      const res = await webSearch({ query: "   " });
      expect(res.results).toEqual([]);
      expect(formatWebSearchResult(res)).toContain("No search results found");
    });
  });
});

describe("WebCrawl Engine", () => {
  describe("extractOutboundLinks", () => {
    it("extracts markdown and HTML links and resolves relative paths", () => {
      const content = `
        Check our [Documentation](/docs/intro) and [API Guide](https://voltrix.stream/api).
        Also see <a href="/pricing">Pricing</a> and <a href="https://other.com/help">Help</a>.
        Ignore images: [Logo](/images/logo.png)
      `;
      const links = extractOutboundLinks(content, "https://voltrix.stream/home");
      expect(links).toContain("https://voltrix.stream/docs/intro");
      expect(links).toContain("https://voltrix.stream/api");
      expect(links).toContain("https://voltrix.stream/pricing");
      expect(links).toContain("https://other.com/help");
      expect(links).not.toContain("https://voltrix.stream/images/logo.png");
    });
  });

  describe("webCrawl execution", () => {
    it("crawls bounded pages and formats markdown", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        return {
          ok: true,
          status: 200,
          text: async () => `
            <html>
              <head><title>Voltrix Page</title></head>
              <body>
                <h1>Welcome to Voltrix</h1>
                <p>Learn about our <a href="/features">Features</a>.</p>
              </body>
            </html>
          `,
        };
      });

      try {
        const crawlRes = await webCrawl({
          url: "https://voltrix.stream",
          maxPages: 2,
          maxDepth: 2,
          sameDomainOnly: true,
        });

        expect(crawlRes.rootUrl).toBe("https://voltrix.stream/");
        expect(crawlRes.pages.length).toBeGreaterThan(0);
        expect(crawlRes.pages[0].url).toBe("https://voltrix.stream/");

        const formatted = formatWebCrawlResult(crawlRes);
        expect(formatted).toContain("### Web Crawl Summary: https://voltrix.stream/");
        expect(formatted).toContain("Welcome to Voltrix");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
