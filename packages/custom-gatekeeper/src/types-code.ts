// Auto-generated — this string is what the CF OS agent sees as the TypeScript API.
// Keep in sync with types.d.ts
const TYPES_CODE = `
export interface StudentProfile {
  userId: string; name: string; email: string;
  university: string; course: string; year: number;
  plan: "free" | "pro" | "enterprise";
}
export interface Flashcard {
  id: string; front: string; back: string;
  easiness: number; interval: number; repetitions: number;
  nextReview: number; dueNow: boolean;
}
export interface FlashcardGenerateOptions {
  topic: string; count?: number;
  level?: "High School" | "Undergraduate" | "Postgraduate"; courseId?: string;
}
export interface FlashcardReviewResult {
  cardId: string; easiness: number; interval: number; repetitions: number; nextReview: number;
}
export interface DocumentMeta {
  id: string; name: string; type: string; sizeBytes: number; vectorized: boolean; createdAt: number;
}
export interface GenerateDocumentOptions {
  type: "essay" | "report" | "lab_report" | "literature_review" | "case_study";
  title: string; instructions: string; wordCount?: number;
  university?: string; courseName?: string; courseCode?: string;
}
export interface GeneratedDocumentResult {
  docId: string; status: "queued" | "ready"; downloadUrl?: string; wordCount?: number;
}
export interface ExamPrediction {
  question: string; topic: string; likelihood: "high" | "medium" | "low"; keyPoints: string[];
}
export interface ExamPredictOptions {
  course: string; university?: string; topics: string[]; documentId?: string;
}
export interface MathSolveOptions { problem: string; topic?: string; stepByStep?: boolean; }
export interface MathStep { stepNumber: number; title: string; explanation: string; latex: string; }
export interface MathSolveResult {
  problemTitle: string; topic: string; steps: MathStep[];
  finalAnswer: string; finalLatex: string; conceptsSummary: string;
}
export interface CodeReviewOptions { code: string; language?: string; hintMode?: boolean; }
export interface CodeReviewResult { review: string; language: string; }
export interface ParaphraseOptions {
  text: string; tone?: "academic" | "formal" | "concise" | "expanded" | "fluency" | "simplify";
  intensity?: "low" | "medium" | "high";
}
export interface ParaphraseResult {
  paraphrasedText: string; originalText: string; tone: string;
  changes: Array<{ original: string; replacement: string; reason: string }>;
  metrics: { originalWordCount: number; paraphrasedWordCount: number;
    academicRigorScore: number; readabilityScore: number; similarityReductionPct: number; };
}
export interface OriginalityAuditResult {
  overallOriginalityScore: number; riskLevel: "Low" | "Medium" | "High"; summary: string;
  flaggedPassages: Array<{ text: string; risk: "Low" | "Medium" | "High"; reason: string; suggestion: string; }>;
  writingStyleAnalysis: { voiceConsistency: "consistent" | "inconsistent"; toneShifts: string[]; vocabularyComplexity: "simple" | "moderate" | "advanced"; };
  recommendations: string[];
}
export interface ProofreadResult {
  correctedText: string;
  changes: Array<{ original: string; corrected: string; reason: string }>;
  overallScore: number; summary: string;
}
export interface DebateOptions { topic: string; rounds?: number; }
export interface DebateResult {
  topic: string; rounds: Array<{ persona: string; argument: string; }>; synthesis: string;
}
export interface TranslateOptions { text: string; targetLanguage: string; sourceLanguage?: string; }
export interface TranslateResult { translatedText: string; sourceLanguage: string; targetLanguage: string; }

export interface VoltrixAcademicSession {
  getProfile(): Promise<StudentProfile>;
  getDueFlashcards(): Promise<Flashcard[]>;
  generateFlashcards(options: FlashcardGenerateOptions): Promise<Flashcard[]>;
  reviewFlashcard(cardId: string, quality: number): Promise<FlashcardReviewResult>;
  listDocuments(): Promise<DocumentMeta[]>;
  generateDocument(options: GenerateDocumentOptions): Promise<GeneratedDocumentResult>;
  getDocumentStatus(docId: string): Promise<GeneratedDocumentResult>;
  searchDocuments(query: string): Promise<Array<{ documentId: string; excerpt: string; score: number }>>;
  solveMath(options: MathSolveOptions): Promise<MathSolveResult>;
  reviewCode(options: CodeReviewOptions): Promise<CodeReviewResult>;
  paraphrase(options: ParaphraseOptions): Promise<ParaphraseResult>;
  proofread(text: string): Promise<ProofreadResult>;
  auditOriginality(text: string): Promise<OriginalityAuditResult>;
  predictExamQuestions(options: ExamPredictOptions): Promise<ExamPrediction[]>;
  debate(options: DebateOptions): Promise<DebateResult>;
  translate(options: TranslateOptions): Promise<TranslateResult>;
  getWorkspaceId(): Promise<string | null>;
  setWorkspaceId(workspaceId: string): Promise<void>;
}
`;

export default TYPES_CODE;
