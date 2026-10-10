import { createWorkshopLogger } from "./observability";
const logger = createWorkshopLogger("workshop.document-classifier");
const CLASSIFY_SAMPLE_CHARS = 2000;
const CLASSIFIER_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export type DocumentCategory = "past-paper" | "textbook" | "notes" | "personal" | "other";
export type DocumentClassification = { shareable: boolean; hasPII: boolean; category: DocumentCategory; reason: string; };

const FAIL_CLOSED: DocumentClassification = { shareable: false, hasPII: true, category: "personal", reason: "Classification failed — defaulting to not shareable." };

export async function classifyDocument(ai: Ai, text: string): Promise<DocumentClassification> {
  const sample = text.slice(0, CLASSIFY_SAMPLE_CHARS);
  const prompt = `You are a document safety classifier for an academic platform used by students.

Analyze the following document excerpt and respond with a JSON object only — no prose, no markdown.

Categories:
- "past-paper": an exam, past paper, marking scheme, or test
- "textbook": a textbook chapter, reference material, or curriculum document
- "notes": study notes, revision material, lecture notes
- "personal": the student's own work (essay, assignment), personal records, ID documents, financial records, land titles, or anything referencing a specific individual's private information
- "other": anything not fitting the above

PII indicators (mark hasPII: true if any present):
- Full names of real people, National ID/student ID/registration numbers
- Phone numbers, email addresses, physical addresses, plot/land references
- Bank account or financial details, grades attributed to a named individual
- First-person possessive of sensitive items ("my ID", "my results", "my plot")

Respond with ONLY this JSON (no other text):
{"shareable":<true|false>,"hasPII":<true|false>,"category":"<category>","reason":"<one sentence>"}

Rules: shareable=true only for past-paper/textbook/notes WITHOUT hasPII. shareable=false for personal/other/anything with hasPII.

Document excerpt:
---
${sample}
---`;
  try {
    const response = await (ai as unknown as {
      run(model: string, input: { messages: Array<{ role: string; content: string }> }): Promise<{ response?: string }>;
    }).run(CLASSIFIER_MODEL, { messages: [{ role: "user", content: prompt }] });
    const raw = response?.response?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { logger.warn("classifyDocument: no JSON in response", { event: "document-classifier.no-json" }); return FAIL_CLOSED; }
    const parsed = JSON.parse(jsonMatch[0]) as Partial<DocumentClassification>;
    const category = isValidCategory(parsed.category) ? parsed.category : "other";
    const hasPII = Boolean(parsed.hasPII);
    const shareable = Boolean(parsed.shareable) && !hasPII && category !== "personal" && category !== "other";
    return { shareable, hasPII, category, reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "" };
  } catch (err) {
    logger.warn("classifyDocument failed", { event: "document-classifier.error", error: err });
    return FAIL_CLOSED;
  }
}

function isValidCategory(v: unknown): v is DocumentCategory {
  return v === "past-paper" || v === "textbook" || v === "notes" || v === "personal" || v === "other";
}
