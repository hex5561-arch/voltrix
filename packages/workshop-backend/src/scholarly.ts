// Scholarly & Academic Retrieval Module for Voltrix OS
// Integrates OpenAlex (250M+ peer-reviewed papers) and Wikibooks (open curriculum & guides).

import { createWorkshopLogger } from "./observability";

const logger = createWorkshopLogger("workshop.scholarly");

const OPENALEX_BASE = "https://api.openalex.org";
const OPENALEX_MAILTO = "contact@voltrix.stream";
const WIKIBOOKS_API = "https://en.wikibooks.org/w/api.php";

export interface OpenAlexWork {
  id: string;
  title: string;
  doi?: string | null;
  publicationYear?: number;
  citedByCount: number;
  authors: string[];
  journal?: string;
  openAccess: boolean;
  pdfUrl?: string | null;
  landingPageUrl?: string | null;
  abstract?: string;
}

export interface OpenAlexSearchResult {
  count: number;
  query: string;
  works: OpenAlexWork[];
}

export interface WikibookSearchResult {
  query: string;
  results: Array<{
    title: string;
    snippet: string;
    pageId: number;
    url: string;
  }>;
}

export interface WikibookPageContent {
  title: string;
  extract: string;
  url: string;
}

/**
 * Reconstruct abstract from OpenAlex inverted index: { "word": [pos1, pos2, ...] }
 */
export function reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]> | null): string {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const positions: Record<number, string> = {};
  for (const [word, posList] of Object.entries(invertedIndex)) {
    if (Array.isArray(posList)) {
      for (const pos of posList) {
        positions[pos] = word;
      }
    }
  }
  const sortedPositions = Object.keys(positions)
    .map(Number)
    .sort((a, b) => a - b);
  return sortedPositions.map((pos) => positions[pos]).join(" ").slice(0, 500);
}

/**
 * Fallback search via Crossref REST API (handles high-throughput scholarly search without 429 rate-limiting).
 */
export async function searchCrossref(query: string, limit: number = 5): Promise<OpenAlexSearchResult> {
  const count = Math.min(Math.max(limit || 5, 1), 10);
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", String(count));
  url.searchParams.set("mailto", OPENALEX_MAILTO);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": `Voltrix/${OPENALEX_MAILTO}` },
    });
    if (!res.ok) {
      throw new Error(`Crossref HTTP ${res.status}: ${res.statusText}`);
    }
    const data = (await res.json()) as any;
    const items = data.message?.items || [];
    const works: OpenAlexWork[] = items.map((item: any) => {
      const authors = (item.author || [])
        .map((a: any) => `${a.given || ""} ${a.family || ""}`.trim())
        .filter(Boolean);
      const year =
        item.published?.["date-parts"]?.[0]?.[0] ||
        item["created"]?.["date-parts"]?.[0]?.[0];
      const journal = item["container-title"]?.[0] || item.publisher;
      const doi = item.DOI ? `https://doi.org/${item.DOI}` : null;
      const pdfUrl = item.link?.find((l: any) => l["content-type"] === "application/pdf")?.URL || null;

      return {
        id: item.DOI || item.URL || `cr-${Math.random()}`,
        title: item.title?.[0] || "Untitled Work",
        doi,
        publicationYear: year,
        citedByCount: item["is-referenced-by-count"] || 0,
        authors,
        journal,
        openAccess: Boolean(pdfUrl),
        pdfUrl,
        landingPageUrl: item.URL || doi,
        abstract: item.abstract ? item.abstract.replace(/<[^>]+>/g, "").slice(0, 400) : undefined,
      };
    });

    return {
      count: data.message?.["total-results"] || works.length,
      query,
      works,
    };
  } catch (err: any) {
    logger.warn(`Crossref fallback failed: ${err.message}`, { event: "scholar.crossref.failed" });
    return { count: 0, query, works: [] };
  }
}

/**
 * Search OpenAlex for peer-reviewed academic works.
 */
export async function searchOpenAlex(
  query: string,
  options: {
    limit?: number;
    fromYear?: number;
    openAccessOnly?: boolean;
    apiKey?: string;
  } = {}
): Promise<OpenAlexSearchResult> {
  const limit = Math.min(Math.max(options.limit || 5, 1), 15);
  const url = new URL(`${OPENALEX_BASE}/works`);
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(limit));
  url.searchParams.set(
    "select",
    "id,title,doi,publication_year,cited_by_count,abstract_inverted_index,authorships,open_access,primary_location,biblio"
  );
  url.searchParams.set("sort", "relevance_score:desc");
  url.searchParams.set("mailto", OPENALEX_MAILTO);

  if (options.apiKey) {
    url.searchParams.set("api_key", options.apiKey);
  }

  const filters: string[] = [];
  if (options.openAccessOnly) filters.push("open_access.is_oa:true");
  if (options.fromYear) filters.push(`publication_year:>${options.fromYear}`);
  if (filters.length > 0) {
    url.searchParams.set("filter", filters.join(","));
  }

  logger.info(`Searching OpenAlex: "${query}" (limit=${limit})`, { event: "scholar.openalex.search" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    let res: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      res = await fetch(url.toString(), {
        headers: { "User-Agent": `Voltrix/${OPENALEX_MAILTO}` },
        signal: controller.signal,
      });
      if (res && res.ok) break;
      if (res && res.status === 429) {
        // Shared Cloudflare edge IPs often hit OpenAlex free pool limit — seamless fallback to Crossref
        clearTimeout(timeout);
        logger.info(`OpenAlex rate-limited, falling back to Crossref for "${query}"`, { event: "scholar.openalex.crossref_fallback" });
        return searchCrossref(query, limit);
      }
    }
    clearTimeout(timeout);

    if (!res || !res.ok) {
      // Fallback on any error
      return searchCrossref(query, limit);
    }

    const data = (await res.json()) as any;
    const rawWorks = data.results || [];

    const works: OpenAlexWork[] = rawWorks.map((w: any) => {
      const authors = (w.authorships || [])
        .map((a: any) => a?.author?.display_name)
        .filter(Boolean);
      const journal =
        w.primary_location?.source?.display_name ||
        w.biblio?.issue ||
        undefined;
      const abstract = reconstructOpenAlexAbstract(w.abstract_inverted_index);

      return {
        id: w.id,
        title: w.title || "Untitled Work",
        doi: w.doi || null,
        publicationYear: w.publication_year || undefined,
        citedByCount: w.cited_by_count || 0,
        authors,
        journal,
        openAccess: Boolean(w.open_access?.is_oa),
        pdfUrl: w.open_access?.oa_url || null,
        landingPageUrl: w.primary_location?.landing_page_url || w.doi || null,
        abstract: abstract ? `${abstract}...` : undefined,
      };
    });

    return {
      count: data.meta?.count || works.length,
      query,
      works,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn(`OpenAlex search failed: ${err.message}`, { event: "scholar.openalex.failed" });
    throw err;
  }
}

/**
 * Format OpenAlex works into an academic markdown block for LLM prompt context or chat responses.
 */
export function formatOpenAlexResults(result: OpenAlexSearchResult): string {
  if (result.works.length === 0) {
    return `No peer-reviewed papers found on OpenAlex for "${result.query}".`;
  }

  const lines = [
    `### OpenAlex Peer-Reviewed Literature: "${result.query}" (${result.count.toLocaleString()} total found)\n`,
  ];

  result.works.forEach((w, i) => {
    const authorStr = w.authors.length > 0 ? w.authors.slice(0, 3).join(", ") + (w.authors.length > 3 ? " et al." : "") : "Unknown Authors";
    const yearStr = w.publicationYear ? String(w.publicationYear) : "n.d.";
    const venueStr = w.journal ? ` | *${w.journal}*` : "";

    lines.push(`**${i + 1}. ${w.title}** (${yearStr})`);
    lines.push(`- **Authors**: ${authorStr}${venueStr}`);
    lines.push(`- **Citations**: ${(w.citedByCount ?? 0).toLocaleString()} | **Open Access**: ${w.openAccess ? "✅ Yes" : "❌ No"}`);
    if (w.doi) lines.push(`- **DOI**: [${w.doi}](${w.doi})`);
    if (w.pdfUrl) lines.push(`- **Direct PDF**: [View / Download PDF](${w.pdfUrl})`);
    if (w.abstract) lines.push(`- **Abstract**: ${w.abstract}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

/**
 * Search Wikibooks for curriculum guides and textbook chapters.
 */
export async function searchWikibooks(
  query: string,
  limit: number = 5
): Promise<WikibookSearchResult> {
  const count = Math.min(Math.max(limit, 1), 10);
  const url = new URL(WIKIBOOKS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");
  url.searchParams.set("srlimit", String(count));

  logger.info(`Searching Wikibooks: "${query}" (limit=${count})`, { event: "scholar.wikibooks.search" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "VoltrixOS/1.0 (academic; mailto:volt@voltrix.dev)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Wikibooks HTTP ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const items = data.query?.search || [];

    const results = items.map((item: any) => {
      // Strip HTML tags from snippet
      const cleanSnippet = (item.snippet || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .trim();

      const pageTitleEncoded = encodeURIComponent(item.title.replace(/ /g, "_"));
      return {
        title: item.title,
        snippet: cleanSnippet,
        pageId: item.pageid,
        url: `https://en.wikibooks.org/wiki/${pageTitleEncoded}`,
      };
    });

    return { query, results };
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn(`Wikibooks search failed: ${err.message}`, { event: "scholar.wikibooks.failed" });
    throw err;
  }
}

/**
 * Read the plain-text extract of a specific Wikibook page.
 */
export async function readWikibookPage(
  title: string,
  maxChars: number = 4000
): Promise<WikibookPageContent> {
  const url = new URL(WIKIBOOKS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("titles", title);
  url.searchParams.set("format", "json");
  url.searchParams.set("utf8", "1");

  logger.info(`Reading Wikibook page: "${title}"`, { event: "scholar.wikibooks.page" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "VoltrixOS/1.0 (academic; mailto:volt@voltrix.dev)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Wikibooks page HTTP ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    const pages = data.query?.pages || {};
    const firstKey = Object.keys(pages)[0];

    if (!firstKey || firstKey === "-1") {
      throw new Error(`Wikibook page "${title}" not found.`);
    }

    const page = pages[firstKey];
    let extract = page.extract || "";
    if (extract.length > maxChars) {
      extract = `${extract.slice(0, maxChars)}\n\n[... content truncated for length ...]`;
    }

    const pageTitleEncoded = encodeURIComponent(page.title.replace(/ /g, "_"));
    return {
      title: page.title,
      extract,
      url: `https://en.wikibooks.org/wiki/${pageTitleEncoded}`,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn(`Reading Wikibook page failed: ${err.message}`, { event: "scholar.wikibooks.page.failed" });
    throw err;
  }
}

// ── OpenStax College Textbooks Catalog & Resolution ─────────────────────────

export interface OpenStaxBook {
  slug: string;
  title: string;
  subjects: string[];
  url: string;
  pdfUrl: string;
}

export const OPENSTAX_CATALOG: OpenStaxBook[] = [
  { slug: "calculus-volume-1", title: "Calculus Volume 1", subjects: ["calculus", "derivatives", "integrals", "math", "limits"], url: "https://openstax.org/details/books/calculus-volume-1", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/CalculusVol1-WEB.pdf" },
  { slug: "calculus-volume-2", title: "Calculus Volume 2", subjects: ["calculus", "integration", "differential equations", "sequences", "series"], url: "https://openstax.org/details/books/calculus-volume-2", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/CalculusVol2-WEB.pdf" },
  { slug: "calculus-volume-3", title: "Calculus Volume 3", subjects: ["calculus", "multivariable", "vectors", "partial derivatives"], url: "https://openstax.org/details/books/calculus-volume-3", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/CalculusVol3-WEB.pdf" },
  { slug: "university-physics-volume-1", title: "University Physics Volume 1", subjects: ["physics", "mechanics", "waves", "acoustics", "thermodynamics"], url: "https://openstax.org/details/books/university-physics-volume-1", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol1-WEB.pdf" },
  { slug: "university-physics-volume-2", title: "University Physics Volume 2", subjects: ["physics", "thermodynamics", "electricity", "magnetism"], url: "https://openstax.org/details/books/university-physics-volume-2", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol2-WEB.pdf" },
  { slug: "university-physics-volume-3", title: "University Physics Volume 3", subjects: ["physics", "optics", "quantum", "modern physics"], url: "https://openstax.org/details/books/university-physics-volume-3", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol3-WEB.pdf" },
  { slug: "college-physics-2e", title: "College Physics 2e", subjects: ["physics", "algebra-based physics", "mechanics", "kinematics"], url: "https://openstax.org/details/books/college-physics-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/CollegePhysics2e-WEB.pdf" },
  { slug: "chemistry-2e", title: "Chemistry 2e", subjects: ["chemistry", "general chemistry", "molecules", "reactions", "stoichiometry"], url: "https://openstax.org/details/books/chemistry-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Chemistry2e-WEB.pdf" },
  { slug: "chemistry-atoms-first-2e", title: "Chemistry: Atoms First 2e", subjects: ["chemistry", "atomic structure", "quantum", "chemical bonding"], url: "https://openstax.org/details/books/chemistry-atoms-first-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/ChemistryAtomsFirst2e-WEB.pdf" },
  { slug: "organic-chemistry", title: "Organic Chemistry", subjects: ["organic chemistry", "functional groups", "synthesis", "reaction mechanisms"], url: "https://openstax.org/details/books/organic-chemistry", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/OrganicChemistry-WEB.pdf" },
  { slug: "biology-2e", title: "Biology 2e", subjects: ["biology", "genetics", "evolution", "cells", "ecology"], url: "https://openstax.org/details/books/biology-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Biology2e-WEB.pdf" },
  { slug: "concepts-of-biology", title: "Concepts of Biology", subjects: ["biology", "cellular biology", "evolution", "ecology"], url: "https://openstax.org/details/books/concepts-of-biology", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/ConceptsofBiology-WEB.pdf" },
  { slug: "microbiology", title: "Microbiology", subjects: ["microbiology", "bacteria", "viruses", "immunology", "pathogens"], url: "https://openstax.org/details/books/microbiology", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Microbiology-WEB.pdf" },
  { slug: "anatomy-and-physiology-2e", title: "Anatomy and Physiology 2e", subjects: ["anatomy", "physiology", "human body", "organs", "medical"], url: "https://openstax.org/details/books/anatomy-and-physiology-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/AnatomyandPhysiology2e-WEB.pdf" },
  { slug: "introduction-to-statistics", title: "Introductory Statistics 2e", subjects: ["statistics", "probability", "data analysis", "hypothesis testing"], url: "https://openstax.org/details/books/introduction-to-statistics", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/IntroductoryStatistics2e-WEB.pdf" },
  { slug: "introductory-business-statistics-2e", title: "Introductory Business Statistics 2e", subjects: ["statistics", "business", "regression", "analytics"], url: "https://openstax.org/details/books/introductory-business-statistics-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/IntroductoryBusinessStatistics2e-WEB.pdf" },
  { slug: "college-algebra-2e", title: "College Algebra 2e", subjects: ["algebra", "polynomials", "equations", "math"], url: "https://openstax.org/details/books/college-algebra-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/CollegeAlgebra2e-WEB.pdf" },
  { slug: "algebra-and-trigonometry-2e", title: "Algebra and Trigonometry 2e", subjects: ["algebra", "trigonometry", "analytic geometry"], url: "https://openstax.org/details/books/algebra-and-trigonometry-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/AlgebraandTrigonometry2e-WEB.pdf" },
  { slug: "precalculus-2e", title: "Precalculus 2e", subjects: ["precalculus", "trigonometry", "functions", "math"], url: "https://openstax.org/details/books/precalculus-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Precalculus2e-WEB.pdf" },
  { slug: "principles-of-economics-3e", title: "Principles of Economics 3e", subjects: ["economics", "microeconomics", "macroeconomics", "markets", "trade"], url: "https://openstax.org/details/books/principles-of-economics-3e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/PrinciplesofEconomics3e-WEB.pdf" },
  { slug: "principles-of-microeconomics-3e", title: "Principles of Microeconomics 3e", subjects: ["microeconomics", "supply and demand", "elasticity", "competition"], url: "https://openstax.org/details/books/principles-of-microeconomics-3e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/PrinciplesofMicroeconomics3e-WEB.pdf" },
  { slug: "principles-of-macroeconomics-3e", title: "Principles of Macroeconomics 3e", subjects: ["macroeconomics", "gdp", "inflation", "monetary policy", "fiscal policy"], url: "https://openstax.org/details/books/principles-of-macroeconomics-3e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/PrinciplesofMacroeconomics3e-WEB.pdf" },
  { slug: "principles-of-accounting-volume-1-financial", title: "Principles of Accounting Volume 1: Financial", subjects: ["accounting", "financial accounting", "balance sheet", "income statement"], url: "https://openstax.org/details/books/principles-accounting-volume-1-financial-accounting", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/FinancialAccounting-WEB.pdf" },
  { slug: "principles-of-accounting-volume-2-managerial", title: "Principles of Accounting Volume 2: Managerial", subjects: ["accounting", "managerial accounting", "cost accounting", "budgeting"], url: "https://openstax.org/details/books/principles-accounting-volume-2-managerial-accounting", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/ManagerialAccounting-WEB.pdf" },
  { slug: "principles-of-management", title: "Principles of Management", subjects: ["management", "leadership", "organization", "strategy"], url: "https://openstax.org/details/books/principles-management", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/PrinciplesofManagement-WEB.pdf" },
  { slug: "organizational-behavior", title: "Organizational Behavior", subjects: ["organizational behavior", "human resources", "workplace psychology"], url: "https://openstax.org/details/books/organizational-behavior", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/OrganizationalBehavior-WEB.pdf" },
  { slug: "introduction-to-python-programming", title: "Introduction to Python Programming", subjects: ["python", "programming", "computer science", "coding", "software", "algorithms"], url: "https://openstax.org/details/books/introduction-to-python-programming", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/IntroductiontoPythonProgramming-WEB.pdf" },
  { slug: "computer-science-principles", title: "Computer Science Principles", subjects: ["computer science", "data structures", "networks", "security", "algorithms"], url: "https://openstax.org/details/books/computer-science", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/ComputerScience-WEB.pdf" },
  { slug: "psychology-2e", title: "Psychology 2e", subjects: ["psychology", "cognition", "behavior", "neuroscience", "mind", "memory"], url: "https://openstax.org/details/books/psychology-2e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Psychology2e-WEB.pdf" },
  { slug: "sociology-3e", title: "Sociology 3e", subjects: ["sociology", "society", "culture", "social institutions", "social structure"], url: "https://openstax.org/details/books/sociology-3e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/Sociology3e-WEB.pdf" },
  { slug: "american-government-3e", title: "American Government 3e", subjects: ["government", "political science", "constitution", "civil rights"], url: "https://openstax.org/details/books/american-government-3e", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/AmericanGovernment3e-WEB.pdf" },
  { slug: "us-history", title: "U.S. History", subjects: ["history", "us history", "american history", "revolution", "civil war"], url: "https://openstax.org/details/books/us-history", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/USHistory-WEB.pdf" },
  { slug: "world-history-volume-1", title: "World History Volume 1", subjects: ["world history", "ancient civilizations", "history", "renaissance"], url: "https://openstax.org/details/books/world-history-volume-1", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/WorldHistoryVol1-WEB.pdf" },
  { slug: "world-history-volume-2", title: "World History Volume 2", subjects: ["world history", "modern history", "globalization", "industrial revolution"], url: "https://openstax.org/details/books/world-history-volume-2", pdfUrl: "https://assets.openstax.org/oscms-prodcms/media/documents/WorldHistoryVol2-WEB.pdf" }
];

export function searchOpenStax(query: string): OpenStaxBook[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return OPENSTAX_CATALOG.slice(0, 5);

  const matched = OPENSTAX_CATALOG.filter(b => {
    return b.title.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.subjects.some(s => q.includes(s) || s.includes(q));
  });

  return matched.length > 0 ? matched : OPENSTAX_CATALOG.slice(0, 4);
}
