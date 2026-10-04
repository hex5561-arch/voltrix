/**
 * Voltrix Academic Gatekeeper — TypeScript API surface
 * Exposed to the CF OS agent and all Gadgets that request this Gatekeeper.
 */

// ─── Student profile ──────────────────────────────────────────────────────────
export interface StudentProfile {
  userId: string;
  name: string;
  email: string;
  university: string;
  course: string;
  year: number;
  plan: "free" | "pro" | "enterprise";
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  easiness: number;
  interval: number;     // days until next review
  repetitions: number;
  nextReview: number;   // unix timestamp
  dueNow: boolean;
}

export interface FlashcardGenerateOptions {
  topic: string;
  count?: number;       // default 20
  level?: string;       // "secondary" | "undergraduate" | "postgraduate"
  courseId?: string;
}

export interface FlashcardReviewResult {
  cardId: string;
  easiness: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}

// ─── Documents ────────────────────────────────────────────────────────────────
export interface DocumentMeta {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  vectorized: boolean;
  createdAt: number;
}

export interface GenerateDocumentOptions {
  type: "essay" | "report" | "lab_report" | "literature_review" | "case_study";
  title: string;
  instructions: string;
  wordCount?: number;   // default 1500, min 500
  courseId?: string;
}

export interface GeneratedDocumentResult {
  docId: string;
  status: "queued" | "ready";
  downloadUrl?: string;
  wordCount?: number;
}

// ─── Exam prediction ──────────────────────────────────────────────────────────
export interface ExamPrediction {
  question: string;
  topic: string;
  likelihood: "high" | "medium" | "low";
  keyPoints: string[];
}

export interface ExamPredictOptions {
  course: string;
  topics: string[];
  documentId?: string;
}

// ─── Originality audit ───────────────────────────────────────────────────────
export interface OriginalityAuditResult {
  overallScore: number;        // 0–100, higher = more original
  riskLevel: "low" | "medium" | "high";
  flaggedPassages: Array<{ text: string; reason: string }>;
  recommendations: string[];
}

// ─── Main session interface ───────────────────────────────────────────────────
export interface VoltrixAcademicSession {
  /** Get the current student's profile */
  getProfile(): Promise<StudentProfile>;

  /** Get flashcards due for review today */
  getDueFlashcards(): Promise<Flashcard[]>;

  /** Generate new flashcards on a topic and save them */
  generateFlashcards(options: FlashcardGenerateOptions): Promise<Flashcard[]>;

  /** Submit SM-2 review quality (0–5) for a card */
  reviewFlashcard(cardId: string, quality: number): Promise<FlashcardReviewResult>;

  /** List the student's uploaded documents */
  listDocuments(): Promise<DocumentMeta[]>;

  /** Generate an academic document (essay, report, etc.) */
  generateDocument(options: GenerateDocumentOptions): Promise<GeneratedDocumentResult>;

  /** Check status of a queued document */
  getDocumentStatus(docId: string): Promise<GeneratedDocumentResult>;

  /** Predict likely exam questions for a course */
  predictExamQuestions(options: ExamPredictOptions): Promise<ExamPrediction[]>;

  /** Run an originality audit on a piece of text */
  auditOriginality(text: string): Promise<OriginalityAuditResult>;

  /** Search student's documents semantically */
  searchDocuments(query: string): Promise<Array<{ documentId: string; excerpt: string; score: number }>>;
}
