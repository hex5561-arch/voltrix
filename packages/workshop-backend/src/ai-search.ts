// AI Search — Cloudflare AI Search integration for the Voltrix content library.
//
// All content is stored in a single AI Search instance named LIBRARY_INSTANCE_ID within the
// deployment's default namespace (env.AI_SEARCH). The instance is created lazily on first write
// so deployments that never index anything pay nothing.
//
// Retrieval uses hybrid search (vector + BM25 keyword) with reranking enabled so the agent gets
// the most semantically relevant chunks, not just keyword matches. The agent receives up to
// MAX_SEARCH_RESULTS chunks per query; each chunk is formatted as a titled block with its
// source key and score so the agent can cite sources correctly.
//
// Admin operations (index, list, delete) are exposed through AdminApi and called from the
// admin Library tab. The agent only ever reads; writes are admin-only.

import { createWorkshopLogger } from "./observability";

const logger = createWorkshopLogger("workshop.ai-search");

/** The single AI Search instance that holds the deployment's content library. */
export const LIBRARY_INSTANCE_ID = "voltrix-library";

/** Maximum number of result chunks returned to the agent per query. */
const MAX_SEARCH_RESULTS = 8;

/** Narrow env type — only what ai-search.ts needs. */
export type AiSearchEnv = {
  AI_SEARCH: AiSearchNamespace;
};

/** One result chunk returned by searchLibrary(). */
export type LibraryChunk = {
  /** Source document key (filename or URL the admin indexed). */
  key: string;
  /** Relevance score 0–1. */
  score: number;
  /** Extracted text content of this chunk. */
  text: string;
};

/** Result returned by searchLibrary(). */
export type LibrarySearchResult = {
  /** Chunks in descending score order. Empty when no relevant content found. */
  chunks: LibraryChunk[];
  /** The query as understood by AI Search (may be rewritten). */
  searchQuery: string;
};

/** Metadata stored on each indexed item so the admin UI can display source info. */
export type LibraryItemMetadata = {
  /** Human-readable title for display in the admin UI. */
  title?: string;
  /** Original URL when the item was indexed from a URL. */
  sourceUrl?: string;
  /** ISO timestamp of when the admin indexed this item. */
  indexedAt?: string;
};

/** Admin-facing view of one indexed item. */
export type LibraryItem = {
  id: string;
  /** Filename/key used when the item was uploaded. */
  key: string;
  /** Processing status from AI Search. */
  status: AiSearchItemInfo["status"];
  /** Number of indexed chunks, if known. */
  chunksCount: number | null;
  /** File size in bytes, if known. */
  fileSize: number | null;
  /** When the item was created (ISO string). */
  createdAt: string | null;
  /** Admin-supplied metadata. */
  metadata: LibraryItemMetadata;
};

// ---------------------------------------------------------------------------
// Ensure-instance helper
// ---------------------------------------------------------------------------

/**
 * Get the library instance, creating it if it doesn't exist yet.
 * Uses hybrid search + reranking by default for best recall.
 * Creation is idempotent: "already exists" errors are swallowed.
 */
async function ensureInstance(env: AiSearchEnv): Promise<AiSearchInstance> {
  try {
    await env.AI_SEARCH.create({
      id: LIBRARY_INSTANCE_ID,
      // Hybrid search: both vector and keyword backends active.
      index_method: { vector: true, keyword: true },
      fusion_method: "rrf",
      reranking: true,
      chunk: true,
      chunk_size: 512,
      chunk_overlap: 64,
    });
  } catch (err) {
    // Already exists is expected after the first deploy — carry on.
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes("already exist") && !msg.toLowerCase().includes("conflict")) {
      logger.warn("unexpected error creating AI Search instance", {
        event: "ai-search.ensure-instance.error",
        error: err,
      });
    }
  }
  return env.AI_SEARCH.get(LIBRARY_INSTANCE_ID);
}

// ---------------------------------------------------------------------------
// Agent-facing: search
// ---------------------------------------------------------------------------

/**
 * Search the deployment's content library for chunks relevant to `query`.
 * Returns null when AI_SEARCH is not bound.
 * Never throws — failures are logged and an empty result is returned so the agent can
 * fall back to web search.
 */
export async function searchLibrary(
  env: AiSearchEnv,
  query: string,
): Promise<LibrarySearchResult | null> {
  try {
    const instance = env.AI_SEARCH.get(LIBRARY_INSTANCE_ID);
    const response = await instance.search({
      query,
      ai_search_options: {
        retrieval: {
          retrieval_type: "hybrid",
          max_num_results: MAX_SEARCH_RESULTS,
          match_threshold: 0.35,
        },
        reranking: { enabled: true },
      },
    });

    return {
      searchQuery: response.search_query,
      chunks: response.chunks.map(c => ({
        key: c.item.key,
        score: c.score,
        text: c.text,
      })),
    };
  } catch (err) {
    logger.warn("searchLibrary failed", { event: "ai-search.search.error", error: err });
    return { searchQuery: query, chunks: [] };
  }
}

/**
 * Format a LibrarySearchResult as a string for the agent tool output.
 * Each chunk is a block with its source and score.
 */
export function formatLibrarySearchResult(result: LibrarySearchResult): string {
  if (result.chunks.length === 0) {
    return `No relevant content found in the library for: "${result.searchQuery}"`;
  }
  const blocks = result.chunks.map((c, i) =>
    [
      `### Result ${i + 1}`,
      `source: ${c.key}`,
      `score: ${c.score.toFixed(3)}`,
      "",
      c.text,
    ].join("\n"),
  );
  return `Library search results for: "${result.searchQuery}"\n\n${blocks.join("\n\n---\n\n")}`;
}

// ---------------------------------------------------------------------------
// Admin-facing: index, list, delete
// ---------------------------------------------------------------------------

/**
 * Index a text document into the library. `key` is the filename;
 * `content` is the document text. `metadata` is stored for display in the admin UI.
 * Uses uploadAndPoll with a 45-second timeout. Throws on error.
 */
export async function indexLibraryItem(
  env: AiSearchEnv,
  key: string,
  content: string,
  metadata: LibraryItemMetadata,
): Promise<LibraryItem> {
  const instance = await ensureInstance(env);
  const info = await instance.items.uploadAndPoll(key, content, {
    metadata: metadata as Record<string, unknown>,
    timeoutMs: 45_000,
  });
  return toLibraryItem(info);
}

/**
 * List all items in the library, newest first.
 * Returns an empty array when the instance doesn't exist yet.
 */
export async function listLibraryItems(env: AiSearchEnv): Promise<LibraryItem[]> {
  try {
    const instance = env.AI_SEARCH.get(LIBRARY_INSTANCE_ID);
    const response = await instance.items.list({
      per_page: 100,
      sort_by: "modified_at",
    });
    return response.result.map(toLibraryItem);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
      return [];
    }
    throw err;
  }
}

/**
 * Delete one item from the library by its item id.
 * Throws when the item or instance doesn't exist.
 */
export async function deleteLibraryItem(env: AiSearchEnv, itemId: string): Promise<void> {
  const instance = env.AI_SEARCH.get(LIBRARY_INSTANCE_ID);
  await instance.items.delete(itemId);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toLibraryItem(info: AiSearchItemInfo): LibraryItem {
  return {
    id: info.id,
    key: info.key,
    status: info.status,
    chunksCount: info.chunks_count ?? null,
    fileSize: info.file_size ?? null,
    createdAt: info.created_at ?? null,
    metadata: (info.metadata ?? {}) as LibraryItemMetadata,
  };
}

// ---------------------------------------------------------------------------
// Personal library — per-user AI Search instances
// ---------------------------------------------------------------------------

const MAX_PERSONAL_RESULTS = 5;

export function personalInstanceId(userId: string): string {
  const sanitized = userId
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `user-${sanitized || "unknown"}`;
}

async function ensurePersonalInstance(env: AiSearchEnv, userId: string): Promise<AiSearchInstance> {
  const id = personalInstanceId(userId);
  try {
    await env.AI_SEARCH.create({
      id, index_method: { vector: true, keyword: true }, fusion_method: "rrf",
      reranking: true, chunk: true, chunk_size: 512, chunk_overlap: 64,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes("already exist") && !msg.toLowerCase().includes("conflict")) {
      logger.warn("unexpected error creating personal AI Search instance", { event: "ai-search.ensure-personal-instance.error", error: err });
    }
  }
  return env.AI_SEARCH.get(id);
}

export async function isKeyInSharedLibrary(env: AiSearchEnv, key: string): Promise<boolean> {
  try {
    const instance = env.AI_SEARCH.get(LIBRARY_INSTANCE_ID);
    const results = await instance.items.list({ search: key, per_page: 10 });
    return results.result.some(item => item.key === key);
  } catch { return false; }
}

export async function indexPersonalItem(
  env: AiSearchEnv, userId: string, key: string, content: string, metadata: LibraryItemMetadata = {},
): Promise<void> {
  try {
    const instance = await ensurePersonalInstance(env, userId);
    await instance.items.upload(key, content, {
      metadata: { ...metadata, indexedAt: metadata.indexedAt ?? new Date().toISOString() } as Record<string, unknown>,
    });
  } catch (err) {
    logger.warn("indexPersonalItem failed", { event: "ai-search.personal.index.error", error: err });
  }
}

export async function searchPersonalLibrary(env: AiSearchEnv, userId: string, query: string): Promise<LibrarySearchResult> {
  const instanceId = personalInstanceId(userId);
  try {
    const instance = env.AI_SEARCH.get(instanceId);
    const response = await instance.search({
      query,
      ai_search_options: {
        retrieval: { retrieval_type: "hybrid", max_num_results: MAX_PERSONAL_RESULTS, match_threshold: 0.35 },
        reranking: { enabled: true },
      },
    });
    return { searchQuery: response.search_query, chunks: response.chunks.map(c => ({ key: c.item.key, score: c.score, text: c.text })) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.toLowerCase().includes("not found") && !msg.toLowerCase().includes("404")) {
      logger.warn("searchPersonalLibrary failed", { event: "ai-search.personal.search.error", error: err });
    }
    return { searchQuery: query, chunks: [] };
  }
}
