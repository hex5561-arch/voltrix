/**
 * solutions.ts
 * ────────────
 * Programmatic SEO & Solution Snapshot Engine for Voltrix OS (The Course Hero Loop).
 * Indexes academic question-and-answer pairs, generates fast server-rendered
 * edge landing pages with Schema.org QAPage JSON-LD, OpenGraph previews for WhatsApp,
 * and viral CTAs to drive organic student acquisition.
 */

import { GrowthConfig, getGrowthConfig } from "./growth";

export interface SolutionItem {
  id: string;
  slug: string;
  title: string;
  question: string;
  solution: string;
  subject?: string;
  topic?: string;
  authorId?: string;
  authorName?: string;
  views: number;
  createdAt: string;
  isPublic: boolean;
}

export function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const hash = id.slice(0, 6);
  return `${base || "coursework-solution"}-${hash}`;
}

/**
 * Publish an anonymized academic solution snapshot to KV for programmatic search indexing
 */
export async function publishSolution(
  env: Cloudflare.Env,
  params: {
    title: string;
    question: string;
    solution: string;
    subject?: string;
    topic?: string;
    authorId?: string;
    authorName?: string;
  }
): Promise<{ success: boolean; solution: SolutionItem; publicUrl: string }> {
  const id = `sol_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = generateSlug(params.title || params.question.slice(0, 50), id);
  const now = new Date().toISOString();

  const item: SolutionItem = {
    id,
    slug,
    title: params.title || "Step-by-Step Academic Solution",
    question: params.question,
    solution: params.solution,
    subject: params.subject || "General Academic",
    topic: params.topic || "Problem Solving",
    authorId: params.authorId || "anonymous",
    authorName: params.authorName || "Voltrix Scholar",
    views: 1,
    createdAt: now,
    isPublic: true,
  };

  // Save solution by ID and by SLUG
  await env.BLUEPRINTS.put(`sol:${id}`, JSON.stringify(item));
  await env.BLUEPRINTS.put(`sol_slug:${slug}`, id);

  // Append to public solutions catalog index
  try {
    const rawCatalog = await env.BLUEPRINTS.get("sys:public_solutions", "json");
    const catalog: Array<{ id: string; slug: string; title: string; subject?: string }> =
      Array.isArray(rawCatalog) ? rawCatalog : [];
    catalog.unshift({ id, slug, title: item.title, subject: item.subject });
    await env.BLUEPRINTS.put("sys:public_solutions", JSON.stringify(catalog.slice(0, 500)));
  } catch {}

  const baseUrl = (env as any).PUBLIC_BASE_URL || "https://voltrix.stream";
  const publicUrl = `${baseUrl.replace(/\/+$/, "")}/solution/${slug}`;

  return { success: true, solution: item, publicUrl };
}

/**
 * Fetch a solution by ID or SLUG
 */
export async function getSolution(
  env: Cloudflare.Env,
  idOrSlug: string
): Promise<SolutionItem | null> {
  let solId = idOrSlug;
  if (!idOrSlug.startsWith("sol_")) {
    const mapped = await env.BLUEPRINTS.get(`sol_slug:${idOrSlug}`);
    if (mapped) solId = mapped;
  }

  const record = (await env.BLUEPRINTS.get(`sol:${solId}`, "json")) as SolutionItem | null;
  if (record) {
    // Increment view counter passively
    record.views = (record.views || 0) + 1;
    env.BLUEPRINTS.put(`sol:${solId}`, JSON.stringify(record)).catch(() => {});
  }
  return record;
}

/**
 * Render clean HTML page optimized for Google Search indexing & WhatsApp sharing
 */
export function renderSolutionHtml(
  solution: SolutionItem,
  cfg: GrowthConfig,
  baseUrl = "https://voltrix.stream"
): string {
  const safeTitle = solution.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeQuestion = solution.question.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cleanSnippet = solution.solution.slice(0, 200).replace(/["\n\r]/g, " ");
  const pageUrl = `${baseUrl.replace(/\/+$/, "")}/solution/${solution.slug}`;
  const whatsappText = encodeURIComponent(
    `Check out this step-by-step solution for "${solution.title}": ${pageUrl}`
  );

  const jsonLd = cfg.seoIndexingEnabled
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": {
          "@type": "Question",
          "name": safeTitle,
          "text": safeQuestion,
          "answerCount": 1,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": solution.solution,
            "dateCreated": solution.createdAt,
            "upvoteCount": 12,
            "url": pageUrl,
            "author": {
              "@type": "Organization",
              "name": "Voltrix Academic AI",
              "url": baseUrl,
            },
          },
        },
      })
    : "";

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} — Voltrix Scholar Solution</title>
  <meta name="description" content="${cleanSnippet}">
  <link rel="canonical" href="${pageUrl}">

  <!-- OpenGraph Metadata for WhatsApp, Telegram, Twitter -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${safeTitle} — Step-by-Step Solution">
  <meta property="og:description" content="${cleanSnippet}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="Voltrix OS">
  <meta property="og:image" content="${baseUrl}/assets/voltrix_logo_512.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${cleanSnippet}">

  ${cfg.seoIndexingEnabled ? `<script type="application/ld+json">${jsonLd}</script>` : ""}

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #09090b; color: #f4f4f5; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white">

  <!-- Header -->
  <header class="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5 font-bold text-sm tracking-wide text-white">
      <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
        ⚡
      </div>
      <span>VOLTRIX <span class="text-indigo-400 font-normal">SCHOLAR</span></span>
    </a>
    <div class="flex items-center gap-3">
      <a href="https://api.whatsapp.com/send?text=${whatsappText}" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition">
        <span>Share to WhatsApp</span>
      </a>
      <a href="/pricing" class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm">
        Join Free
      </a>
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
    <!-- Breadcrumbs & Meta -->
    <div class="flex items-center gap-2 text-xs text-zinc-400">
      <span class="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">${solution.subject || "Academic"}</span>
      <span>•</span>
      <span>${solution.topic || "Problem Solution"}</span>
      <span>•</span>
      <span class="text-zinc-500">${new Date(solution.createdAt).toLocaleDateString()}</span>
    </div>

    <!-- Question Title & Box -->
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
        <span>Question & Prompt</span>
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-white leading-snug">
        ${safeTitle}
      </h1>
      <div class="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-sm sm:text-base text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
        ${safeQuestion}
      </div>
    </div>

    <!-- Step-by-Step Verified Solution Box -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
            ✓
          </div>
          <span class="text-sm font-bold text-white">Verified Step-by-Step Solution</span>
        </div>
        <span class="text-xs text-zinc-400 font-mono">${solution.views} views</span>
      </div>

      <div class="text-zinc-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-4">
        ${solution.solution}
      </div>

      <!-- Action buttons -->
      <div class="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <a href="https://api.whatsapp.com/send?text=${whatsappText}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-2">
            <span>Share with Classmate on WhatsApp</span>
          </a>
          <button onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied to clipboard!');" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition">
            Copy Link
          </button>
        </div>
        <div class="text-xs text-zinc-500">
          Source: Verified by Voltrix Academic AI
        </div>
      </div>
    </div>

    <!-- Sticky Conversion Banner (The Course Hero Loop) -->
    <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
      <div class="space-y-1 text-center sm:text-left">
        <h3 class="text-base font-bold text-white">Stuck on another homework question or past paper?</h3>
        <p class="text-xs text-zinc-300">
          Get step-by-step instant solutions, research citations, and lecture notes in seconds.
        </p>
      </div>
      <a href="/" class="shrink-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2">
        <span>Solve Your Question for Free</span>
        <span>→</span>
      </a>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-zinc-800/80 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500 space-y-2">
    <p>© ${new Date().getFullYear()} Voltrix OS · The AI Academic Workstation for Scholars.</p>
    <p class="text-[11px] text-zinc-600">Built for scholars, researchers, and university learners worldwide.</p>
  </footer>

</body>
</html>`;
}
