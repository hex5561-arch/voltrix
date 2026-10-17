/**
 * Multi-Page Web Crawling Engine for Voltrix OS
 *
 * Traverses public HTTPS web targets up to bounded depth and page limits.
 * Integrates with:
 * - Kitesurf Browser Run ("markdown" Quick Action) for dynamic SPAs
 * - Workers AI `toMarkdown()` via webFetch for fast document extraction
 * - Relative link resolution and domain filtering
 */

import { validateWebFetchUrl } from "./web-fetch.js";
import { webBrowse, type WebBrowseEnv } from "./web-browse.js";

export interface CrawledPage {
  url: string;
  depth: number;
  title?: string;
  content: string;
  linksFound: number;
  status: number;
  error?: string;
}

export interface WebCrawlOptions {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  sameDomainOnly?: boolean;
}

export interface WebCrawlResult {
  rootUrl: string;
  pagesCrawled: number;
  pages: CrawledPage[];
  totalLinksDiscovered: number;
}

/**
 * Normalizes and extracts outgoing URLs from HTML and Markdown content
 */
export function extractOutboundLinks(content: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const base = new URL(baseUrl);

  // 1. Markdown link pattern: [anchor](url)
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\)/g;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = mdRegex.exec(content)) !== null) {
    try {
      const resolved = new URL(mdMatch[2], base);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") {
        resolved.hash = ""; // Strip anchor
        links.add(resolved.toString());
      }
    } catch {}
  }

  // 2. HTML href pattern: <a ... href="..." ...>
  const htmlRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = htmlRegex.exec(content)) !== null) {
    const raw = htmlMatch[1].trim();
    if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) {
      continue;
    }
    try {
      const resolved = new URL(raw, base);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") {
        resolved.hash = "";
        links.add(resolved.toString());
      }
    } catch {}
  }

  // Filter out static media extensions to save fetch budget
  const IGNORED_EXTS = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|mp4|webm|mp3|wav|ogg|zip|tar|gz|rar|exe|dmg|iso)$/i;

  return Array.from(links).filter((u) => {
    try {
      const p = new URL(u);
      return !IGNORED_EXTS.test(p.pathname);
    } catch {
      return false;
    }
  });
}

/**
 * Fetches a single page via Kitesurf browser (or fetch fallback) and extracts markdown
 */
export async function fetchPageMarkdown(
  targetUrl: string,
  browserEnv?: WebBrowseEnv | null
): Promise<{ content: string; status: number; title?: string }> {
  // If Browser Run with Kitesurf is available, use it for complete SPA rendering
  if (browserEnv?.browser) {
    try {
      const browseRes = await webBrowse(browserEnv, { url: targetUrl });
      const firstLine = browseRes.body.split("\n").find((l) => l.startsWith("# ")) || "";
      const title = firstLine.replace(/^#\s+/, "").trim() || undefined;
      return {
        content: browseRes.body,
        status: 200,
        title,
      };
    } catch (browserErr) {
      // Fallback to direct fetch below
    }
  }

  // Direct fetch fallback
  const parsed = validateWebFetchUrl(targetUrl);
  const resp = await fetch(parsed.toString(), {
    headers: {
      "User-Agent": "VoltrixWebCrawler/1.0",
      "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!resp.ok) {
    return {
      content: `Failed to fetch page (HTTP ${resp.status} ${resp.statusText})`,
      status: resp.status,
    };
  }

  const rawText = await resp.text();
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(rawText);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Simple HTML to text/markdown conversion
  const cleanBody = rawText
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n• $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return {
    content: cleanBody.slice(0, 15000),
    status: resp.status,
    title,
  };
}

/**
 * BFS Web Crawler executing up to maxPages and maxDepth
 */
export async function webCrawl(
  options: WebCrawlOptions,
  browserEnv?: WebBrowseEnv | null
): Promise<WebCrawlResult> {
  const root = validateWebFetchUrl(options.url);
  const rootUrl = root.toString();
  const maxPages = Math.min(Math.max(options.maxPages ?? 3, 1), 8);
  const maxDepth = Math.min(Math.max(options.maxDepth ?? 2, 1), 3);
  const sameDomainOnly = options.sameDomainOnly ?? true;
  const targetHostname = root.hostname;

  const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 1 }];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  let totalLinksDiscovered = 0;

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift()!;
    if (visited.has(current.url)) continue;
    visited.add(current.url);

    try {
      const { content, status, title } = await fetchPageMarkdown(current.url, browserEnv);
      const outbound = extractOutboundLinks(content, current.url);
      totalLinksDiscovered += outbound.length;

      pages.push({
        url: current.url,
        depth: current.depth,
        title,
        content: content.slice(0, 8000),
        linksFound: outbound.length,
        status,
      });

      // Enqueue child links if depth allows
      if (current.depth < maxDepth && pages.length + queue.length < maxPages * 2) {
        for (const link of outbound) {
          try {
            const parsedLink = new URL(link);
            if (sameDomainOnly && parsedLink.hostname !== targetHostname) {
              continue;
            }
            if (!visited.has(link) && !queue.some((q) => q.url === link)) {
              queue.push({ url: link, depth: current.depth + 1 });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      pages.push({
        url: current.url,
        depth: current.depth,
        content: `Error crawling URL: ${err.message}`,
        linksFound: 0,
        status: 500,
        error: err.message,
      });
    }
  }

  return {
    rootUrl,
    pagesCrawled: pages.length,
    pages,
    totalLinksDiscovered,
  };
}

/**
 * Formats multi-page crawl results for agent consumption
 */
export function formatWebCrawlResult(result: WebCrawlResult): string {
  const lines: string[] = [
    `### Web Crawl Summary: ${result.rootUrl}`,
    `_Crawled ${result.pagesCrawled} pages, discovered ${result.totalLinksDiscovered} links._`,
    "",
  ];

  result.pages.forEach((page, idx) => {
    lines.push(`#### Page ${idx + 1} (Depth ${page.depth}): [${page.title || page.url}](${page.url})`);
    lines.push(`_Status: HTTP ${page.status} | Outbound Links: ${page.linksFound}_`);
    lines.push("");
    lines.push("```markdown");
    lines.push(page.content.slice(0, 1500) + (page.content.length > 1500 ? "\n...[truncated]" : ""));
    lines.push("```");
    lines.push("");
  });

  return lines.join("\n").trim();
}
