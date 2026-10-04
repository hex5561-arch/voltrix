import {
  DurableObject,
  RpcStub,
  RpcTarget,
  WorkerEntrypoint,
} from "cloudflare:workers";
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
  const result = (await (env as any).AI.run(
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
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

// ─── Embedding helper ─────────────────────────────────────────────────────────
async function embed(env: Cloudflare.Env, text: string): Promise<number[]> {
  const result = (await (env as any).AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  })) as { data: number[][] };
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
    const row = await (this.#env as any).DB.prepare(
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
    const rows = await (this.#env as any).DB.prepare(
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
    const db = (this.#env as any).DB;
    const stmt = db.prepare(
      "INSERT INTO flashcards (id, user_id, course_id, front, back, next_review, created_at) VALUES (?,?,?,?,?,?,?)",
    );

    const inserted: Flashcard[] = [];
    await db.batch(
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

    const card = await (this.#env as any).DB.prepare(
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

    await (this.#env as any).DB.prepare(
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
    const rows = await (this.#env as any).DB.prepare(
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

  async generateDocument(
    options: GenerateDocumentOptions,
  ): Promise<GeneratedDocumentResult> {
    await this.#queue.authorizeObservation({
      title: "Generate document",
      description: `Generate a ${options.type}: "${options.title}" (${options.wordCount ?? 1500} words).`,
    });

    const {
      type,
      title,
      instructions,
      wordCount = 1500,
      courseId,
    } = options;

    const profile = await (this.#env as any).DB.prepare(
      "SELECT university, course, year FROM users WHERE id = ?",
    )
      .bind(this.#userId)
      .first<{ university: string; course: string; year: number }>();

    const docId = crypto.randomUUID();

    await (this.#env as any).DB.prepare(
      "INSERT INTO generated_docs (id, user_id, type, title) VALUES (?,?,?,?)",
    )
      .bind(docId, this.#userId, type, title)
      .run();

    // Queue generation — TASK_QUEUE binding
    await (this.#env as any).TASK_QUEUE.send({
      type: "generate-doc",
      payload: {
        docId,
        userId: this.#userId,
        type,
        title,
        prompt: instructions,
        wordCount,
        profile: profile ?? {},
        courseId: courseId ?? null,
      },
    });

    return { docId, status: "queued" };
  }

  async getDocumentStatus(docId: string): Promise<GeneratedDocumentResult> {
    await this.#queue.authorizeObservation({
      title: "Check document status",
      description: `Check if document ${docId} is ready.`,
    });

    const cached = await (this.#env as any).CACHE.get(`doc-ready:${docId}`);
    if (cached) {
      const data = JSON.parse(cached) as {
        ready: boolean;
        r2Key?: string;
        wordCount?: number;
      };
      return {
        docId,
        status: data.ready ? "ready" : "queued",
        downloadUrl: data.r2Key
          ? `/api/generated/${docId}/download`
          : undefined,
        wordCount: data.wordCount,
      };
    }
    return { docId, status: "queued" };
  }

  // ─── Exam prediction ───────────────────────────────────────────────────────
  async predictExamQuestions(
    options: ExamPredictOptions,
  ): Promise<ExamPrediction[]> {
    await this.#queue.authorizeObservation({
      title: "Predict exam questions",
      description: `Predict questions for ${options.course}.`,
    });

    const { course, topics } = options;
    const profile = await (this.#env as any).DB.prepare(
      "SELECT university FROM users WHERE id = ?",
    )
      .bind(this.#userId)
      .first<{ university: string }>();

    const systemPrompt = `You are an expert examiner at ${profile?.university ?? "university"}.
Predict likely exam questions for ${course} based on these topics: ${topics.join(", ")}.
Return JSON only: {"predictions":[{"question":"...","topic":"...","likelihood":"high|medium|low","keyPoints":["..."]}]}`;

    const raw = await callAI(
      this.#env,
      systemPrompt,
      `Generate exam predictions for ${course}`,
      2048,
    );

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          predictions: ExamPrediction[];
        };
        return parsed.predictions ?? [];
      }
    } catch {
      // fall through
    }
    return [];
  }

  // ─── Originality audit ─────────────────────────────────────────────────────
  async auditOriginality(text: string): Promise<OriginalityAuditResult> {
    await this.#queue.authorizeObservation({
      title: "Originality audit",
      description: "Analyse text for originality and flag suspicious passages.",
    });

    const systemPrompt = `You are an academic integrity AI. Analyse the text for originality.
Return JSON only: {
  "overallScore": 0-100,
  "riskLevel": "low|medium|high",
  "flaggedPassages": [{"text":"...","reason":"..."}],
  "recommendations": ["..."]
}`;

    const raw = await callAI(
      this.#env,
      systemPrompt,
      `Analyse this text for originality:\n\n${text.slice(0, 6000)}`,
      1024,
    );

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as OriginalityAuditResult;
    } catch {
      // fall through
    }

    return {
      overallScore: 75,
      riskLevel: "low",
      flaggedPassages: [],
      recommendations: ["Unable to fully analyse — please review manually."],
    };
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
    const results = await (this.#env as any).VECTORIZE.query(queryVector, {
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
