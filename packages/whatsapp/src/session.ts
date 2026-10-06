/**
 * WhatsAppSession — Durable Object
 *
 * One instance per phone number (keyed by E.164 number string).
 * Stores multi-turn conversation history, account linking, and academic profile
 * in SQLite-backed storage so they survive Worker restarts.
 */

import { DurableObject } from "cloudflare:workers";

export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface AcademicProfile {
  university?: string;
  degree?: string;
  year?: string;
  discipline?: string;
  citationStyle?: string;
  courses?: string[];
}

export interface SessionData {
  contactName: string;
  linkedUserId: string | null;
  academicProfile: AcademicProfile | null;
  topicTracking: Record<string, number>;
  history: HistoryEntry[];
  lastActive: number;
  /** Rolling dedup window — last 200 processed Meta message IDs */
  processedIds: string[];
}

const MAX_HISTORY = 14;         // keep last 14 turns (7 exchanges)
const MAX_PROCESSED_IDS = 200;  // dedup window

export class WhatsAppSession extends DurableObject {
  #data: SessionData;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    // Restore from SQLite storage synchronously via blockConcurrencyWhile
    this.#data = {
      contactName: "Student",
      linkedUserId: null,
      academicProfile: null,
      topicTracking: {},
      history: [],
      lastActive: 0,
      processedIds: [],
    };
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<SessionData>("session");
      if (stored) this.#data = stored;
    });
  }

  #persist() {
    // Fire-and-forget — storage writes are durable even if the DO is evicted
    this.ctx.storage.put("session", this.#data);
  }

  // ── Deduplication ──────────────────────────────────────────────────────────

  isProcessed(msgId: string): boolean {
    return this.#data.processedIds.includes(msgId);
  }

  markProcessed(msgId: string): void {
    if (this.isProcessed(msgId)) return;
    this.#data.processedIds.push(msgId);
    if (this.#data.processedIds.length > MAX_PROCESSED_IDS) {
      this.#data.processedIds = this.#data.processedIds.slice(-MAX_PROCESSED_IDS);
    }
    this.#persist();
  }

  // ── History ────────────────────────────────────────────────────────────────

  addMessage(role: "user" | "assistant", content: string): void {
    this.#data.history.push({ role, content, ts: Date.now() });
    if (this.#data.history.length > MAX_HISTORY) {
      this.#data.history = this.#data.history.slice(-MAX_HISTORY);
    }
    this.#data.lastActive = Date.now();
    this.#persist();
  }

  clearHistory(): void {
    this.#data.history = [];
    this.#persist();
  }

  getHistory(): HistoryEntry[] {
    return this.#data.history;
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  setContactName(name: string): void {
    this.#data.contactName = name;
    this.#persist();
  }

  setAcademicProfile(profile: AcademicProfile): void {
    this.#data.academicProfile = profile;
    this.#persist();
  }

  // ── Linking ────────────────────────────────────────────────────────────────

  link(userId: string): void {
    this.#data.linkedUserId = userId;
    this.#persist();
  }

  unlink(): void {
    this.#data.linkedUserId = null;
    this.#persist();
  }

  // ── Topic tracking ─────────────────────────────────────────────────────────

  bumpTopic(topic: string): void {
    this.#data.topicTracking[topic] = (this.#data.topicTracking[topic] ?? 0) + 1;
    this.#persist();
  }

  // ── Snapshot ───────────────────────────────────────────────────────────────

  getSnapshot(): SessionData {
    return { ...this.#data };
  }

  // ── HTTP entrypoint (called by the main worker via DO stub) ────────────────

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path === "/snapshot") {
      return Response.json(this.getSnapshot());
    }

    if (req.method === "POST" && path === "/message") {
      const { role, content } = await req.json<{ role: "user" | "assistant"; content: string }>();
      this.addMessage(role, content);
      return Response.json({ ok: true });
    }

    if (req.method === "POST" && path === "/clear") {
      this.clearHistory();
      return Response.json({ ok: true });
    }

    if (req.method === "POST" && path === "/dedup") {
      const { msgId } = await req.json<{ msgId: string }>();
      if (this.isProcessed(msgId)) return Response.json({ duplicate: true });
      this.markProcessed(msgId);
      return Response.json({ duplicate: false });
    }

    if (req.method === "POST" && path === "/contact") {
      const { name } = await req.json<{ name: string }>();
      this.setContactName(name);
      return Response.json({ ok: true });
    }

    if (req.method === "POST" && path === "/profile") {
      const profile = await req.json<AcademicProfile>();
      this.setAcademicProfile(profile);
      return Response.json({ ok: true });
    }

    if (req.method === "POST" && path === "/link") {
      const { userId } = await req.json<{ userId: string }>();
      this.link(userId);
      return Response.json({ ok: true });
    }

    if (req.method === "POST" && path === "/topic") {
      const { topic } = await req.json<{ topic: string }>();
      this.bumpTopic(topic);
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}
