import {
  DurableObject,
  RpcStub,
  RpcTarget,
  WorkerEntrypoint,
} from "cloudflare:workers";

// Typed helpers to avoid `any` generic call errors on env bindings
function db(env: Cloudflare.Env): D1Database {
  return (env as unknown as { DB: D1Database }).DB;
}
function ai(env: Cloudflare.Env): Ai {
  return (env as unknown as { AI: Ai }).AI;
}
function cache(env: Cloudflare.Env): KVNamespace {
  return (env as unknown as { CACHE: KVNamespace }).CACHE;
}
function queue(env: Cloudflare.Env): Queue {
  return (env as unknown as { TASK_QUEUE: Queue }).TASK_QUEUE;
}
function vectorize(env: Cloudflare.Env): VectorizeIndex {
  return (env as unknown as { VECTORIZE: VectorizeIndex }).VECTORIZE;
}
import { skipRpcValidation, validateRpc } from "capnweb-validate";
import type {
  AccountDescription,
  ApprovalQueue,
  Gatekeeper,
  GatekeeperConnectCallback,
  GatekeeperConnectOptions,
  GatekeeperUser,
  GatekeeperUserVerifier,
  ResourceConfiguratorFrame,
  ResourceDescription,
  SupportedResource,
  VendorDescription,
} from "@gadgets/workshop-shared/gatekeeper";
import type {
  VoltrixAcademicSession,
  StudentProfile,
  Flashcard,
  FlashcardGenerateOptions,
  FlashcardReviewResult,
  DocumentMeta,
  GenerateDocumentOptions,
  GeneratedDocumentResult,
  ExamPrediction,
  ExamPredictOptions,
  OriginalityAuditResult,
} from "./types.js";
import TYPES_CODE from "./types-code.js";

// ─── Branding ─────────────────────────────────────────────────────────────────
const VOLT_ICON = {
  url:
    "data:image/svg+xml," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>" +
      "<rect width='256' height='256' rx='48' fill='#6366f1'/>" +
      "<text x='128' y='180' font-size='140' text-anchor='middle' fill='white' font-family='system-ui'>⚡</text>" +
      "</svg>",
    ),
};

type ObservationQueue = Pick<ApprovalQueue, "authorizeObservation"> &
  Partial<{ [Symbol.dispose](): void }>;

// ─── SM-2 algorithm ───────────────────────────────────────────────────────────
function sm2(ef: number, interval: number, reps: number, q: number) {
  if (q < 3) {
    return {
      easiness: Math.max(1.3, ef - 0.8 + 0.28 * q - 0.02 * q * q),
      interval: 1,
      repetitions: 0,
    };
  }
  const newEf = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const newReps = reps + 1;
  const newInt =
    reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * newEf);
  return { easiness: newEf, interval: newInt, repetitions: newReps };
}

// ─── AI helper — calls Workers AI via env binding ────────────────────────────
async function callAI(
  env: Cloudflare.Env,
  system: string,
  user: string,
  maxTokens = 4096,
): Promise<string> {
  const result = (await ai(env).run(
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as Parameters<Ai["run"]>[0],
    {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
    },
  )) as { response?: string };
  return result.response ?? "";
}

async function embed(env: Cloudflare.Env, text: string): Promise<number[]> {
  const result = (await ai(env).run(
    "@cf/baai/bge-base-en-v1.5" as Parameters<Ai["run"]>[0],
    { text: [text] },
  )) as { data: number[][] };
  return result.data[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// VoltrixAcademicSessionImpl — the actual capability object the agent calls
// ══════════════════════════════════════════════════════════════════════════════

@validateRpc()
export class VoltrixAcademicSessionImpl
  extends RpcTarget
  implements VoltrixAcademicSession
{
  readonly #queue: ObservationQueue;
  readonly #env: Cloudflare.Env;
  readonly #userId: string;

  constructor(queue: ObservationQueue, env: Cloudflare.Env, userId: string) {
    super();
    this.#queue = queue;
    this.#env = env;
    this.#userId = userId;
  }

  // ─── Profile ───────────────────────────────────────────────────────────────
  async getProfile(): Promise<StudentProfile> {
    await this.#queue.authorizeObservation({
      title: "Read student profile",
      description: "Read name, university, course, and year of study.",
    });
    const row = await db(this.#env).prepare(
      "SELECT id, email, name, university, course, year, plan FROM users WHERE id = ?",
    )
      .bind(this.#userId)
      .first<StudentProfile>();
    if (!row) throw new Error("Student profile not found");
    return row;
  }

  // ─── Flashcards ────────────────────────────────────────────────────────────
  async getDueFlashcards(): Promise<Flashcard[]> {
    await this.#queue.authorizeObservation({
      title: "Read due flashcards",
      description: "Fetch cards scheduled for review today.",
    });
    const now = Math.floor(Date.now() / 1000);
    const rows = await db(this.#env).prepare(
      `SELECT id, front, back, easiness, interval, repetitions, next_review
       FROM flashcards WHERE user_id = ? AND next_review <= ?
       ORDER BY next_review ASC LIMIT 50`,
    )
      .bind(this.#userId, now)
      .all<{
        id: string;
        front: string;
        back: string;
        easiness: number;
        interval: number;
        repetitions: number;
        next_review: number;
      }>();

    return rows.results.map((r) => ({
      id: r.id,
      front: r.front,
      back: r.back,
      easiness: r.easiness,
      interval: r.interval,
      repetitions: r.repetitions,
      nextReview: r.next_review,
      dueNow: r.next_review <= now,
    }));
  }

  async generateFlashcards(
    options: FlashcardGenerateOptions,
  ): Promise<Flashcard[]> {
    await this.#queue.authorizeObservation({
      title: "Generate flashcards",
      description: `Generate ${options.count ?? 20} flashcards on "${options.topic}".`,
    });

    const { topic, count = 20, level = "undergraduate", courseId } = options;
    const systemPrompt = `Generate exactly ${count} flashcards for a ${level} student studying "${topic}".
Return a JSON array only: [{"front":"question","back":"answer"}]. No extra text.`;

    const raw = await callAI(
      this.#env,
      systemPrompt,
      `Create ${count} flashcards on: ${topic}`,
      2048,
    );

    let cards: { front: string; back: string }[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      cards = match ? (JSON.parse(match[0]) as typeof cards) : [];
    } catch {
      cards = [];
    }

    if (cards.length === 0) throw new Error("Failed to generate flashcards");

    const now = Math.floor(Date.now() / 1000);
    const d = db(this.#env);
    const stmt = d.prepare(
      "INSERT INTO flashcards (id, user_id, course_id, front, back, next_review, created_at) VALUES (?,?,?,?,?,?,?)",
    );

    const inserted: Flashcard[] = [];
    await d.batch(
      cards.map((c) => {
        const id = crypto.randomUUID();
        inserted.push({
          id,
          front: c.front,
          back: c.back,
          easiness: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: now,
          dueNow: true,
        });
        return stmt.bind(
          id,
          this.#userId,
          courseId ?? null,
          c.front,
          c.back,
          now,
          now,
        );
      }),
    );

    return inserted;
  }

  async reviewFlashcard(
    cardId: string,
    quality: number,
  ): Promise<FlashcardReviewResult> {
    await this.#queue.authorizeObservation({
      title: "Review flashcard",
      description: `Submit quality ${quality}/5 for card ${cardId}.`,
    });

    const card = await db(this.#env).prepare(
      "SELECT easiness, interval, repetitions FROM flashcards WHERE id = ? AND user_id = ?",
    )
      .bind(cardId, this.#userId)
      .first<{ easiness: number; interval: number; repetitions: number }>();

    if (!card) throw new Error("Flashcard not found");

    const result = sm2(
      card.easiness,
      card.interval,
      card.repetitions,
      Math.min(5, Math.max(0, quality)),
    );
    const nextReview =
      Math.floor(Date.now() / 1000) + result.interval * 86400;

    await db(this.#env).prepare(
      "UPDATE flashcards SET easiness=?, interval=?, repetitions=?, next_review=?, last_reviewed=? WHERE id=?",
    )
      .bind(
        result.easiness,
        result.interval,
        result.repetitions,
        nextReview,
        Math.floor(Date.now() / 1000),
        cardId,
      )
      .run();

    return {
      cardId,
      easiness: result.easiness,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview,
    };
  }

  // ─── Documents ─────────────────────────────────────────────────────────────
  async listDocuments(): Promise<DocumentMeta[]> {
    await this.#queue.authorizeObservation({
      title: "List documents",
      description: "Fetch the student's uploaded documents.",
    });
    const rows = await db(this.#env).prepare(
      `SELECT id, name, type, size_bytes, vectorized, created_at
       FROM documents WHERE user_id = ? ORDER BY created_at DESC`,
    )
      .bind(this.#userId)
      .all<{
        id: string;
        name: string;
        type: string;
        size_bytes: number;
        vectorized: number;
        created_at: number;
      }>();

    return rows.results.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sizeBytes: r.size_bytes,
      vectorized: r.vectorized === 1,
      createdAt: r.created_at,
    }));
  }

  // ─── Semantic search ───────────────────────────────────────────────────────
  async searchDocuments(
    query: string,
  ): Promise<Array<{ documentId: string; excerpt: string; score: number }>> {
    await this.#queue.authorizeObservation({
      title: "Search documents",
      description: `Semantic search: "${query.slice(0, 80)}"`,
    });

    const queryVector = await embed(this.#env, query);
    const results = await vectorize(this.#env).query(queryVector, {
      topK: 5,
      filter: { userId: this.#userId },
      returnMetadata: "all",
    });

    return results.matches
      .filter((m: { score: number }) => m.score > 0.5)
      .map((m: { metadata?: Record<string, unknown>; score: number }) => ({
        documentId: (m.metadata?.["documentId"] as string) ?? "",
        excerpt: (m.metadata?.["text"] as string) ?? "",
        score: m.score,
      }));
  }

  // ─── voltrix.stream API proxy ─────────────────────────────────────────────
  /**
   * Call a voltrix.stream endpoint. Routes through our existing, battle-tested
   * coursehero edge function instead of spending Dynamic Worker budget on inference.
   * Cost: one HTTP subrequest (~$0.000001) instead of one Dynamic Worker ($0.002).
   *
   * Responses are cached in KV by a hash of the action + payload.
   * Cache TTLs are tuned per action — deterministic results cache longer.
   */
  #apiUrl(): string {
    return (this.#env as unknown as { VOLTRIX_API_URL?: string }).VOLTRIX_API_URL
      ?? "https://voltrix.stream/api";
  }

  /** TTL in seconds per action. 0 = no cache. */
  static #cacheTtl: Record<string, number> = {
    mathSolver:       7 * 24 * 3600,  // 7 days — math is deterministic
    examPredict:      7 * 24 * 3600,  // 7 days — exam questions are stable
    paraphrase:           24 * 3600,  // 24 hours
    proofread:            24 * 3600,  // 24 hours
    translate:            24 * 3600,  // 24 hours
    codeReview:           24 * 3600,  // 24 hours
    debate:                    3600,  // 1 hour
    originalityAudit:          3600,  // 1 hour
    createDocument:               0,  // never — personalised per student
  };

  async #cacheKey(action: string, payload: Record<string, unknown>): Promise<string> {
    const raw = action + JSON.stringify(payload, Object.keys(payload).sort());
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `vcache:${action}:${hex.slice(0, 32)}`;
  }

  async #voltrixFetch<T>(action: string, payload: Record<string, unknown>): Promise<T> {
    const ttl = VoltrixAcademicSessionImpl.#cacheTtl[action] ?? 3600;

    // Check KV cache first (skip for uncached actions)
    if (ttl > 0) {
      const key = await this.#cacheKey(action, payload);
      const cached = await cache(this.#env).get(key, "json").catch(() => null);
      if (cached !== null) return cached as T;

      const res = await fetch(this.#apiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error(`Voltrix API error ${res.status} for action "${action}"`);
      const data = await res.json() as T;

      // Write to KV — fire and forget, don't block the response
      cache(this.#env).put(key, JSON.stringify(data), { expirationTtl: ttl }).catch(() => {});
      return data;
    }

    // No cache for this action
    const res = await fetch(this.#apiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error(`Voltrix API error ${res.status} for action "${action}"`);
    return res.json() as Promise<T>;
  }

  // ─── Document generation (via voltrix.stream) ────────────────────────────
  async generateDocument(
    options: import("./types.js").GenerateDocumentOptions,
  ): Promise<import("./types.js").GeneratedDocumentResult> {
    await this.#queue.authorizeObservation({
      title: "Generate document",
      description: `Generate ${options.type}: "${options.title}"`,
    });
    const profile = await db(this.#env).prepare(
      "SELECT university, course FROM users WHERE id = ?",
    ).bind(this.#userId).first<{ university: string; course: string }>();

    return this.#voltrixFetch("createDocument", {
      action: "createDocument",
      docType: "docx",
      title: options.title,
      content: options.instructions,
      prompt: options.instructions,
      wordCount: options.wordCount ?? 1500,
      institutionalProfile: {
        university: options.university ?? profile?.university ?? "",
        courseName: options.courseName ?? profile?.course ?? "",
        courseCode: options.courseCode ?? "",
      },
    });
  }

  async getDocumentStatus(docId: string): Promise<import("./types.js").GeneratedDocumentResult> {
    await this.#queue.authorizeObservation({
      title: "Check document status",
      description: `Check if document ${docId} is ready.`,
    });
    const cached = await cache(this.#env).get(`doc-ready:${docId}`);
    if (cached) {
      const data = JSON.parse(cached) as { ready: boolean; r2Key?: string; wordCount?: number };
      return {
        docId,
        status: data.ready ? "ready" : "queued",
        downloadUrl: data.r2Key ? `/api/generated/${docId}/download` : undefined,
        wordCount: data.wordCount,
      };
    }
    return { docId, status: "queued" };
  }

  // ─── Math solver ──────────────────────────────────────────────────────────
  async solveMath(options: import("./types.js").MathSolveOptions): Promise<import("./types.js").MathSolveResult> {
    await this.#queue.authorizeObservation({
      title: "Solve math problem",
      description: `Solve: "${options.problem.slice(0, 80)}"`,
    });
    return this.#voltrixFetch("mathSolver", {
      problem: options.problem,
      topic: options.topic ?? "Mathematics",
      stepByStep: options.stepByStep !== false,
    });
  }

  // ─── Code review ──────────────────────────────────────────────────────────
  async reviewCode(options: import("./types.js").CodeReviewOptions): Promise<import("./types.js").CodeReviewResult> {
    await this.#queue.authorizeObservation({
      title: "Review code",
      description: `Review ${options.language ?? "code"} (${options.code.length} chars)`,
    });
    const result = await this.#voltrixFetch<{ review?: string; content?: string }>("codeReview", {
      codeSnippet: options.code,
      codeLanguage: options.language ?? "Python",
      hintMode: options.hintMode ?? false,
    });
    return {
      review: result.review ?? result.content ?? "",
      language: options.language ?? "Python",
    };
  }

  // ─── Paraphrase ───────────────────────────────────────────────────────────
  async paraphrase(options: import("./types.js").ParaphraseOptions): Promise<import("./types.js").ParaphraseResult> {
    await this.#queue.authorizeObservation({
      title: "Paraphrase text",
      description: `Paraphrase in ${options.tone ?? "academic"} tone`,
    });
    return this.#voltrixFetch("paraphrase", {
      originalText: options.text,
      tone: options.tone ?? "academic",
      intensity: options.intensity ?? "medium",
    });
  }

  // ─── Proofread ────────────────────────────────────────────────────────────
  async proofread(text: string): Promise<import("./types.js").ProofreadResult> {
    await this.#queue.authorizeObservation({
      title: "Proofread text",
      description: `Proofread ${text.length} characters`,
    });
    const result = await this.#voltrixFetch<{
      correctedText?: string; content?: string;
      changes?: Array<{ original: string; corrected: string; reason: string }>;
      overallScore?: number; summary?: string;
    }>("proofread", { prompt: text, text });
    return {
      correctedText: result.correctedText ?? result.content ?? text,
      changes: result.changes ?? [],
      overallScore: result.overallScore ?? 80,
      summary: result.summary ?? "Proofread complete.",
    };
  }

  // ─── Originality audit ────────────────────────────────────────────────────
  async auditOriginality(text: string): Promise<import("./types.js").OriginalityAuditResult> {
    await this.#queue.authorizeObservation({
      title: "Originality audit",
      description: "Analyse text for originality and flag suspicious passages.",
    });
    return this.#voltrixFetch("originalityAudit", { text, prompt: text });
  }

  // ─── Exam prediction ──────────────────────────────────────────────────────
  async predictExamQuestions(
    options: import("./types.js").ExamPredictOptions,
  ): Promise<import("./types.js").ExamPrediction[]> {
    await this.#queue.authorizeObservation({
      title: "Predict exam questions",
      description: `Predict questions for ${options.course}`,
    });
    // Fetch student profile for university context if not provided
    const university = options.university
      ?? (await db(this.#env).prepare("SELECT university FROM users WHERE id = ?")
          .bind(this.#userId).first<{ university: string }>())?.university
      ?? "";

    const result = await this.#voltrixFetch<{
      predictions?: import("./types.js").ExamPrediction[];
      questions?: import("./types.js").ExamPrediction[];
    }>("examPredict", {
      course: options.course,
      university,
      topics: options.topics,
      prompt: `Predict exam questions for ${options.course} covering: ${options.topics.join(", ")}`,
    });
    return result.predictions ?? result.questions ?? [];
  }

  // ─── Debate ───────────────────────────────────────────────────────────────
  async debate(options: import("./types.js").DebateOptions): Promise<import("./types.js").DebateResult> {
    await this.#queue.authorizeObservation({
      title: "Academic debate",
      description: `Multi-agent debate: "${options.topic.slice(0, 60)}"`,
    });
    const result = await this.#voltrixFetch<{
      rounds?: Array<{ persona: string; argument: string }>;
      synthesis?: string;
    }>("debate", {
      topic: options.topic,
      rounds: options.rounds ?? 3,
      prompt: options.topic,
    });
    return {
      topic: options.topic,
      rounds: result.rounds ?? [],
      synthesis: result.synthesis ?? "",
    };
  }

  // ─── Translation ──────────────────────────────────────────────────────────
  async translate(options: import("./types.js").TranslateOptions): Promise<import("./types.js").TranslateResult> {
    await this.#queue.authorizeObservation({
      title: "Translate text",
      description: `Translate to ${options.targetLanguage}`,
    });
    const result = await this.#voltrixFetch<{
      translatedText?: string; content?: string;
      sourceLanguage?: string; targetLanguage?: string;
    }>("translate", {
      text: options.text,
      targetLanguage: options.targetLanguage,
      sourceLanguage: options.sourceLanguage ?? "auto",
      prompt: options.text,
    });
    return {
      translatedText: result.translatedText ?? result.content ?? options.text,
      sourceLanguage: result.sourceLanguage ?? options.sourceLanguage ?? "auto",
      targetLanguage: result.targetLanguage ?? options.targetLanguage,
    };
  }

  // ─── Workspace enforcement ─────────────────────────────────────────────────
  /**
   * Returns the student's single persistent Voltrix workspace ID from KV,
   * or null if not yet assigned. Used by the onboarding flow to enforce
   * one OverseerDO instance per student (prevents unbounded DO creation).
   */
  async getWorkspaceId(): Promise<string | null> {
    await this.#queue.authorizeObservation({
      title: "Read Voltrix workspace",
      description: "Retrieve the student's assigned Voltrix workspace ID.",
    });
    const key = `workspace:${this.#userId}`;
    return cache(this.#env).get(key);
  }

  /**
   * Stores the student's Voltrix workspace ID in KV so they always return
   * to the same workspace. Call once after workspace creation.
   */
  async setWorkspaceId(workspaceId: string): Promise<void> {
    await this.#queue.authorizeObservation({
      title: "Assign Voltrix workspace",
      description: "Save the student's Voltrix workspace ID for future sessions.",
    });
    const key = `workspace:${this.#userId}`;
    // No expiry — workspace assignment is permanent
    await cache(this.#env).put(key, workspaceId);
  }

  [Symbol.dispose](): void {
    this.#queue[Symbol.dispose]?.();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Gatekeeper DO — one per student
// ══════════════════════════════════════════════════════════════════════════════

@validateRpc()
export class VoltrixAcademicGatekeeper
  extends DurableObject<Cloudflare.Env>
  implements Gatekeeper<VoltrixAcademicSession>
{
  readonly #userId: string;

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    super(state, env);
    this.#userId = state.id.toString();
  }

  async describe(): Promise<ResourceDescription> {
    return {
      url: "voltrix://academic",
      title: "Voltrix Academic",
      snippet:
        "Access flashcards, document generation, exam prediction, and originality audits.",
      suggestedBindingName: "ACADEMIC",
      tsType: "VoltrixAcademicSession",
    };
  }

  async getTypeScriptTypes(): Promise<string> {
    return TYPES_CODE;
  }

  async getAutoApprovableActions(): Promise<[]> {
    return [];
  }

  async startSession(
    approvalQueue: RpcStub<ApprovalQueue>,
  ): Promise<VoltrixAcademicSession> {
    return new VoltrixAcademicSessionImpl(
      approvalQueue.dup(),
      this.env,
      this.#userId,
    );
  }

  async addObserver(
    _id: string,
    _user: Fetcher<GatekeeperUserVerifier>,
  ): Promise<void> {}
  async removeObserver(_id: string): Promise<void> {}

  async applyAction(action: number): Promise<void> {
    throw new Error(`Voltrix Academic Gatekeeper has no actions (${action}).`);
  }
  async rejectAction(_action: number): Promise<void> {}
  async revertAction(_action: number): Promise<void> {
    throw new Error("Voltrix Academic Gatekeeper has no revertible actions.");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Account, Vendor, Verifier entrypoints
// ══════════════════════════════════════════════════════════════════════════════

export function describeVoltrixVendor(): VendorDescription {
  return {
    displayName: "Voltrix Academic",
    url: "https://voltrix.stream",
    logo: VOLT_ICON,
    color: "#eef2ff",
    tagline: "AI academic copilot — flashcards, essays, exam prediction",
    description:
      "Connect Volt to your student profile for personalised academic assistance: flashcard generation with SM-2 spaced repetition, essay and report generation, exam question prediction, and originality auditing.",
    autoProvisionsAccount: true,
    providesAuth: false,
  };
}

export function describeVoltrixAccount(): AccountDescription {
  return {
    displayName: "Voltrix Academic",
    avatar: VOLT_ICON,
    singleton: { tsType: "VoltrixAcademicSession" },
  };
}

@validateRpc()
export class VoltrixAcademicAccount
  extends WorkerEntrypoint<Cloudflare.Env>
  implements GatekeeperUser
{
  async describe(): Promise<AccountDescription> {
    return describeVoltrixAccount();
  }

  async getSingletonGatekeeperClass(): Promise<
    DurableObjectClass<Gatekeeper<VoltrixAcademicSession>>
  > {
    return this.ctx.exports.VoltrixAcademicGatekeeper({});
  }

  async getSupportedResources(): Promise<SupportedResource[]> {
    return [];
  }

  getGatekeeperClassFor(_url: string): never {
    throw new Error("Voltrix Academic Gatekeeper has no URL-addressed resources.");
  }

  startResourceConfigurator(
    _resourceUrlPattern: string,
  ): Promise<ResourceConfiguratorFrame> {
    throw new Error("Voltrix Academic Gatekeeper has no URL-addressed resources.");
  }

  async ensureResources(
    _resourceUrlPatterns: string[],
  ): Promise<{ url?: string }> {
    return {};
  }

  async revoke(): Promise<void> {}

  reconnect(): Promise<{ url: string }> {
    throw new Error("Voltrix Academic Gatekeeper has no credentials to reconnect.");
  }

  async getAuthenticatedEmail(): Promise<string | null> {
    return null;
  }

  @skipRpcValidation()
  async getVerifier(): Promise<Fetcher<GatekeeperUserVerifier>> {
    return this.ctx.exports.VoltrixVerifier({});
  }
}

@validateRpc()
export class VoltrixVerifier
  extends WorkerEntrypoint<Cloudflare.Env>
  implements GatekeeperUserVerifier
{
  verify(): void {}
}

@validateRpc()
export class GatekeeperVendor extends WorkerEntrypoint<Cloudflare.Env> {
  async describe(): Promise<VendorDescription> {
    return describeVoltrixVendor();
  }

  @skipRpcValidation()
  async createAccount(): Promise<Fetcher<GatekeeperUser>> {
    return this.ctx.exports.VoltrixAcademicAccount({});
  }

  connectAccount(
    _callback: Fetcher<GatekeeperConnectCallback>,
    _options?: GatekeeperConnectOptions,
  ): Promise<{ url: string }> {
    throw new Error(
      "Voltrix Academic Gatekeeper is auto-provisioned — no connect flow needed.",
    );
  }

  async getSupportedResources(
    _options?: { userId?: string },
  ): Promise<SupportedResource[]> {
    return [];
  }

  async getTypeScriptTypes(): Promise<string> {
    return TYPES_CODE;
  }
}
