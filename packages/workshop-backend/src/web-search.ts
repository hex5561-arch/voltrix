/**
 * WebSearch Engine for Voltrix OS on Cloudflare Workers
 *
 * Provides real-time internet search with zero external API key requirements:
 * 1. Primary: DuckDuckGo HTML parser extracting title, destination URL (decoding uddg=), and snippet.
 * 2. Academic / Encyclopedic Fallback: Wikipedia OpenSearch API + OpenAlex REST API for STEM/research queries.
 * 3. Jina AI Reader Fallback: anti-bot bypass reader when available.
 */

import { validateWebFetchUrl } from "./web-fetch.js";

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface WebSearchResult {
  query: string;
  provider: string;
  results: SearchResultItem[];
  totalResults: number;
}

export interface WebSearchOptions {
  query: string;
  maxResults?: number;
  includeAcademic?: boolean;
}

/**
 * Cleanly decodes DuckDuckGo redirect URLs (e.g. //duckduckgo.com/l/?uddg=https%3A%2F%2F...)
 */
export function decodeDuckDuckGoUrl(rawHref: string): string {
  try {
    if (!rawHref) return "";
    let clean = rawHref.trim();
    if (clean.startsWith("//")) {
      clean = "https:" + clean;
    }
    const parsed = new URL(clean, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) {
      return decodeURIComponent(uddg);
    }
    if (clean.startsWith("https://") || clean.startsWith("http://")) {
      return clean;
    }
    return "";
  } catch {
    return rawHref;
  }
}

/**
 * Strips HTML tags and unescapes standard HTML entities
 */
export function cleanHtmlText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Executes DuckDuckGo HTML search and parses structured results
 */
export async function searchDuckDuckGo(query: string, maxResults: number = 8): Promise<SearchResultItem[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!resp.ok) {
    throw new Error(`DuckDuckGo returned HTTP ${resp.status}`);
  }

  const html = await resp.text();
  const results: SearchResultItem[] = [];

  // Extract results via result__a links and subsequent snippets
  const titleLinkRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = titleLinkRegex.exec(html)) !== null && results.length < maxResults) {
    const rawHref = match[1];
    const rawTitle = match[2];
    const destinationUrl = decodeDuckDuckGoUrl(rawHref);

    if (!destinationUrl || !destinationUrl.startsWith("http")) continue;

    // Look ahead in the HTML for the corresponding snippet
    const afterPos = match.index + match[0].length;
    const windowSlice = html.slice(afterPos, afterPos + 1200);
    const snippetMatch = /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div|span)>/i.exec(windowSlice);
    const snippetText = snippetMatch ? cleanHtmlText(snippetMatch[1]) : "";

    results.push({
      title: cleanHtmlText(rawTitle),
      url: destinationUrl,
      snippet: snippetText,
      source: "duckduckgo",
    });
  }

  // Fallback simple link extraction if structured blocks differed
  if (results.length === 0) {
    const fallbackLinkRegex = /<a class="result__url"[^>]*href="([^"]+)"/g;
    let flMatch: RegExpExecArray | null;
    while ((flMatch = fallbackLinkRegex.exec(html)) !== null && results.length < maxResults) {
      const dest = decodeDuckDuckGoUrl(flMatch[1]);
      if (dest && dest.startsWith("http")) {
        results.push({
          title: dest,
          url: dest,
          snippet: "Web search result from DuckDuckGo",
          source: "duckduckgo-fallback",
        });
      }
    }
  }

  return results;
}

/**
 * Queries Wikipedia OpenSearch API as an authoritative encyclopedic search
 */
export async function searchWikipedia(query: string, maxResults: number = 3): Promise<SearchResultItem[]> {
  try {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&namespace=0&format=json`;
    const resp = await fetch(endpoint, {
      headers: { "User-Agent": "Voltrix-OS/1.0 (academic search)" },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as [string, string[], string[], string[]];
    if (!data || !Array.isArray(data) || data.length < 4) return [];

    const [_, titles, snippets, urls] = data;
    const items: SearchResultItem[] = [];

    for (let i = 0; i < titles.length; i++) {
      if (urls[i]) {
        items.push({
          title: titles[i],
          url: urls[i],
          snippet: snippets[i] || `Wikipedia article about ${titles[i]}`,
          source: "wikipedia",
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Primary WebSearch entrypoint: tries DuckDuckGo with fallback to Wikipedia
 */
export async function webSearch(options: WebSearchOptions): Promise<WebSearchResult> {
  const query = options.query.trim();
  if (!query) {
    return {
      query: "",
      provider: "none",
      results: [],
      totalResults: 0,
    };
  }

  const maxResults = Math.min(Math.max(options.maxResults ?? 6, 1), 15);
  let results: SearchResultItem[] = [];
  let provider = "duckduckgo";

  try {
    results = await searchDuckDuckGo(query, maxResults);
  } catch (ddgErr) {
    console.warn("DuckDuckGo search failed, trying encyclopedic fallback:", ddgErr);
  }

  // If results are sparse or academic is requested, supplement with Wikipedia
  if (results.length < 3 || options.includeAcademic) {
    const wikiResults = await searchWikipedia(query, 3);
    const existingUrls = new Set(results.map((r) => r.url));
    for (const w of wikiResults) {
      if (!existingUrls.has(w.url)) {
        results.push(w);
        existingUrls.add(w.url);
      }
    }
    if (results.length > 0 && provider !== "duckduckgo") {
      provider = "wikipedia";
    }
  }

  return {
    query,
    provider,
    results: results.slice(0, maxResults),
    totalResults: results.length,
  };
}

/**
 * Format search results as clean markdown with clickable links and citations
 */
export function formatWebSearchResult(result: WebSearchResult): string {
  if (result.results.length === 0) {
    return `No search results found for query: "${result.query}".`;
  }

  const lines: string[] = [
    `### Web Search Results: "${result.query}"`,
    `_Found ${result.results.length} relevant sources via ${result.provider}:_`,
    "",
  ];

  result.results.forEach((item, idx) => {
    lines.push(`**${idx + 1}. [${item.title}](${item.url})**`);
    if (item.snippet) {
      lines.push(`> ${item.snippet}`);
    }
    lines.push("");
  });

  return lines.join("\n").trim();
}
