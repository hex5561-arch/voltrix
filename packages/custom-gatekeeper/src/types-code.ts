// Auto-generated — this string is what the CF OS agent sees as the TypeScript API.
// Keep in sync with types.d.ts
const TYPES_CODE = `
export interface StudentProfile {
  userId: string;
  name: string;
  email: string;
  university: string;
  course: string;
  year: number;
  plan: "free" | "pro" | "enterprise";
}

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
  level?: string;
  courseId?: string;
}

export interface FlashcardReviewResult {
  cardId: string;
  easiness: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}

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
  courseId?: string;
}

export interface GeneratedDocumentResult {
  docId: string;
  status: "queued" | "ready";
  downloadUrl?: string;
  wordCount?: number;
}

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

export interface OriginalityAuditResult {
  overallScore: number;
  riskLevel: "low" | "medium" | "high";
  flaggedPassages: Array<{ text: string; reason: string }>;
  recommendations: string[];
}

export interface VoltrixAcademicSession {
  getProfile(): Promise<StudentProfile>;
  getDueFlashcards(): Promise<Flashcard[]>;
  generateFlashcards(options: FlashcardGenerateOptions): Promise<Flashcard[]>;
  reviewFlashcard(cardId: string, quality: number): Promise<FlashcardReviewResult>;
  listDocuments(): Promise<DocumentMeta[]>;
  generateDocument(options: GenerateDocumentOptions): Promise<GeneratedDocumentResult>;
  getDocumentStatus(docId: string): Promise<GeneratedDocumentResult>;
  predictExamQuestions(options: ExamPredictOptions): Promise<ExamPrediction[]>;
  auditOriginality(text: string): Promise<OriginalityAuditResult>;
  searchDocuments(query: string): Promise<Array<{ documentId: string; excerpt: string; score: number }>>;
  getWorkspaceId(): Promise<string | null>;
  setWorkspaceId(workspaceId: string): Promise<void>;
}
`;

export default TYPES_CODE;
