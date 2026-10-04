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
  interval: number;
  repetitions: number;
  nextReview: number;
  dueNow: boolean;
}

export interface FlashcardGenerateOptions {
  topic: string;
  count?: number;
  level?: "High School" | "Undergraduate" | "Postgraduate";
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
  wordCount?: number;
  /** Student's university for cover page */
  university?: string;
  /** Student's course name */
  courseName?: string;
  /** Student's course code */
  courseCode?: string;
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
  university?: string;
  topics: string[];
  documentId?: string;
}

// ─── Math solver ──────────────────────────────────────────────────────────────
export interface MathSolveOptions {
  problem: string;
  topic?: string;
  stepByStep?: boolean;
}

export interface MathStep {
  stepNumber: number;
  title: string;
  explanation: string;
  latex: string;
}

export interface MathSolveResult {
  problemTitle: string;
  topic: string;
  steps: MathStep[];
  finalAnswer: string;
  finalLatex: string;
  conceptsSummary: string;
}

// ─── Code review ──────────────────────────────────────────────────────────────
export interface CodeReviewOptions {
  code: string;
  language?: string;
  /** true = hints only, no solution */
  hintMode?: boolean;
}

export interface CodeReviewResult {
  review: string;
  language: string;
}

// ─── Paraphrase ───────────────────────────────────────────────────────────────
export interface ParaphraseOptions {
  text: string;
  tone?: "academic" | "formal" | "concise" | "expanded" | "fluency" | "simplify";
  intensity?: "low" | "medium" | "high";
}

export interface ParaphraseResult {
  paraphrasedText: string;
  originalText: string;
  tone: string;
  changes: Array<{ original: string; replacement: string; reason: string }>;
  metrics: {
    originalWordCount: number;
    paraphrasedWordCount: number;
    academicRigorScore: number;
    readabilityScore: number;
    similarityReductionPct: number;
  };
}

// ─── Originality audit ────────────────────────────────────────────────────────
export interface OriginalityAuditResult {
  overallOriginalityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  summary: string;
  flaggedPassages: Array<{
    text: string;
    risk: "Low" | "Medium" | "High";
    reason: string;
    suggestion: string;
  }>;
  writingStyleAnalysis: {
    voiceConsistency: "consistent" | "inconsistent";
    toneShifts: string[];
    vocabularyComplexity: "simple" | "moderate" | "advanced";
  };
  recommendations: string[];
}

// ─── Proofread ────────────────────────────────────────────────────────────────
export interface ProofreadResult {
  correctedText: string;
  changes: Array<{ original: string; corrected: string; reason: string }>;
  overallScore: number;
  summary: string;
}

// ─── Debate ───────────────────────────────────────────────────────────────────
export interface DebateOptions {
  topic: string;
  rounds?: number;
}

export interface DebateResult {
  topic: string;
  rounds: Array<{
    persona: string;
    argument: string;
  }>;
  synthesis: string;
}

// ─── Translation ──────────────────────────────────────────────────────────────
export interface TranslateOptions {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// ─── Main session interface ───────────────────────────────────────────────────
export interface VoltrixAcademicSession {
  // ── Student identity ──────────────────────────────────────────────────────
  /** Get the current student's profile from D1 */
  getProfile(): Promise<StudentProfile>;

  // ── Flashcards (SM-2) ─────────────────────────────────────────────────────
  /** Get flashcards due for review today */
  getDueFlashcards(): Promise<Flashcard[]>;
  /** Generate new flashcards on a topic and save to D1 */
  generateFlashcards(options: FlashcardGenerateOptions): Promise<Flashcard[]>;
  /** Submit SM-2 review quality (0–5) for a card */
  reviewFlashcard(cardId: string, quality: number): Promise<FlashcardReviewResult>;

  // ── Documents ─────────────────────────────────────────────────────────────
  /** List the student's uploaded documents */
  listDocuments(): Promise<DocumentMeta[]>;
  /** Generate an academic document (essay, report, etc.) via voltrix.stream */
  generateDocument(options: GenerateDocumentOptions): Promise<GeneratedDocumentResult>;
  /** Check generation status of a queued document */
  getDocumentStatus(docId: string): Promise<GeneratedDocumentResult>;
  /** Search student's documents semantically via Vectorize */
  searchDocuments(query: string): Promise<Array<{ documentId: string; excerpt: string; score: number }>>;

  // ── Academic tools (routed through voltrix.stream) ────────────────────────
  /** Solve a math or STEM problem with step-by-step LaTeX derivation */
  solveMath(options: MathSolveOptions): Promise<MathSolveResult>;
  /** Review code for issues, complexity, and improvements */
  reviewCode(options: CodeReviewOptions): Promise<CodeReviewResult>;
  /** Paraphrase text in a chosen academic tone */
  paraphrase(options: ParaphraseOptions): Promise<ParaphraseResult>;
  /** Proofread and correct academic writing */
  proofread(text: string): Promise<ProofreadResult>;
  /** Audit academic text for originality and plagiarism risk */
  auditOriginality(text: string): Promise<OriginalityAuditResult>;
  /** Predict likely exam questions for a course */
  predictExamQuestions(options: ExamPredictOptions): Promise<ExamPrediction[]>;
  /** Run a multi-agent academic debate on a topic */
  debate(options: DebateOptions): Promise<DebateResult>;
  /** Translate text to another language */
  translate(options: TranslateOptions): Promise<TranslateResult>;

  // ── Workspace enforcement ─────────────────────────────────────────────────
  /** Returns the student's single persistent Voltrix workspace ID, or null */
  getWorkspaceId(): Promise<string | null>;
  /** Persists the student's workspace ID — call once after workspace creation */
  setWorkspaceId(workspaceId: string): Promise<void>;
}
