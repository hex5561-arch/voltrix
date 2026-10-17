export interface ParsedQuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  hint?: string;
}

export interface ParsedQuizData {
  title: string;
  difficulty?: string;
  topics?: string;
  questions: ParsedQuizQuestion[];
}

const OPTION_A_SEARCH = /(?:^|\n|\s+)(?:[-*•+]\s+)?(?:\*{1,2}|_{1,2})?(?:\(A\)|A[\.\):])(?:\*{1,2}|_{1,2})?\s+/;
const OPTION_REGEX = /(?:^|\n|\s+)(?:[-*•+]\s+)?(?:\*{1,2}|_{1,2})?(?:\(([A-D])\)|([A-D])[\.\):])(?:\*{1,2}|_{1,2})?\s+/g;
const QUESTION_START_REGEX = /^(?:(?:\*\*|__)?(?:Q\d+[\.\:]?|Question\s*\d+[\.\:]?|\d+[\.\)])(?:\*\*|__)?(?:\s+|$))/i;

/**
 * Extracts multiple options from a question block text.
 * Strictly enforces:
 * 1. Uppercase option markers only (A, B, C, D)
 * 2. Minimum 2, maximum 4 options (prevent cognitive overload)
 * 3. Rejects free-response exam sub-tasks (e.g. "(a) Calculate...", "(b) Derive...")
 * 4. Rejects options exceeding 180 characters
 */
function extractOptionsFromText(text: string): { question: string; options: string[] } | null {
  const matchA = text.search(OPTION_A_SEARCH);
  if (matchA === -1) return null;

  const question = text.slice(0, matchA).trim();
  const optionsText = text.slice(matchA).trim();

  // Match uppercase letters A through D only
  const regex = new RegExp(OPTION_REGEX);
  const splits: Array<{ letter: string; index: number; matchLen: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(optionsText)) !== null) {
    splits.push({
      letter: m[1] || m[2],
      index: m.index,
      matchLen: m[0].length,
    });
  }

  // Exactly 2 to 4 options maximum!
  if (splits.length < 2 || splits.length > 4) return null;

  // Must begin with A followed by B
  if (splits[0].letter !== 'A' || splits[1].letter !== 'B') return null;

  const options: string[] = [];
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].index + splits[i].matchLen;
    const end = i + 1 < splits.length ? splits[i + 1].index : optionsText.length;
    let optText = optionsText.slice(start, end).trim();

    // Clean leading bullets or bold artifacts
    optText = optText.replace(/^[-*•+]\s+/, '').replace(/^[*_]+|[*_]+$/g, '').trim();

    // Reject free-response sub-tasks starting with imperative verbs
    if (
      /^(?:Calculate|Derive|Determine|Explain|Show that|State|Write|Predict|Find|Discuss|Compare|Describe|Sketch)\b/i.test(
        optText
      )
    ) {
      return null;
    }

    // Reject excessively long paragraphs
    if (optText.length > 180) {
      return null;
    }

    options.push(optText);
  }

  return { question, options };
}

/**
 * Automatically extracts genuine multiple-choice questions from standard Markdown text.
 * Returns null if no valid multiple-choice questions are found.
 */
export function parseMarkdownQuiz(raw: string): ParsedQuizData | null {
  if (!raw || typeof raw !== 'string') return null;

  // If already tagged with an explicit quiz code block, do not double-render
  if (/```(?:quiz|assessment|test)\b/i.test(raw)) return null;

  // Title extraction: heading (#), emoji banner (⚡), or default
  const titleMatch = raw.match(/^(?:#+\s*|⚡\s*)(.+)$/m);
  const title = titleMatch
    ? titleMatch[1].replace(/^[⚡\s]+|[⚡\s]+$/g, '').trim()
    : 'Interactive Knowledge Check';

  // Split into question segments (lines starting with Q1, Question 1, 1., etc.)
  const lines = raw.split('\n');
  const questionBlocks: string[] = [];
  let currentBlock: string[] = [];
  let inQuestion = false;

  const isQuestionStart = (line: string) => {
    const trimmed = line.trim();
    return QUESTION_START_REGEX.test(trimmed);
  };

  for (const line of lines) {
    if (isQuestionStart(line)) {
      if (currentBlock.length > 0) {
        questionBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      inQuestion = true;
    }
    if (inQuestion) {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    questionBlocks.push(currentBlock.join('\n'));
  }

  const questions: ParsedQuizQuestion[] = [];

  for (const block of questionBlocks) {
    const res = extractOptionsFromText(block);
    if (res && res.options.length >= 2 && res.options.length <= 4) {
      let q = res.question
        .replace(/^[#*_\s]+/, '')
        .replace(/[*_]+$/, '')
        .trim();
      q = q.replace(/^(?:(?:\*\*|__)?(?:Q\d+[\.\:]?|Question\s*\d+[\.\:]?|\d+[\.\)])(?:\*\*|__)?\s*[-—–.:]?\s*)/i, '');
      q = q.replace(/^\*\*.*?\*\*\s*[:.—–-]?\s*/, '');

      questions.push({
        question: q,
        options: res.options,
        answer: 0,
      });
    }
  }

  if (questions.length === 0) return null;

  return {
    title,
    questions,
  };
}

/**
 * When an interactive quiz card is rendered, cleanly strips the raw question text from
 * the outer markdown so the questions are presented exclusively inside the interactive
 * widget without duplicate outer text, leaving only the introductory context above the card.
 */
export function stripRawOptionsFromMarkdown(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw;
  const firstQ = raw.search(/(?:^|\n)(?:(?:\*\*|__)?(?:Q\d+[\.\:]?|Question\s*\d+[\.\:]?|\d+[\.\)])(?:\*\*|__)?(?:\s+|$))/i);
  if (firstQ !== -1) {
    return raw.slice(0, firstQ).trim();
  }
  return raw;
}
