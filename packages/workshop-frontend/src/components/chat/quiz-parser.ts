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

/**
 * Extracts multiple options from a question block text.
 * Strictly enforces:
 * 1. Uppercase option markers only (A, B, C, D)
 * 2. Minimum 2, maximum 4 options (prevent cognitive overload)
 * 3. Rejects free-response exam sub-tasks (e.g. "(a) Calculate...", "(b) Derive...")
 * 4. Rejects options exceeding 180 characters
 */
function extractOptionsFromText(text: string): { question: string; options: string[] } | null {
  // STRICT UPPERCASE ONLY: "A)" or "A." or "(A)"
  const matchA = text.search(/(?:^|\s)(?:A[\.\)]|\(A\))\s/);
  if (matchA === -1) return null;

  const question = text.slice(0, matchA).trim();
  const optionsText = text.slice(matchA).trim();

  // Match uppercase letters A through D only
  const regex = /(?:^|\s+)(?:([A-D])[\.\)]|\(([A-D])\))\s+/g;
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
    const optText = optionsText.slice(start, end).trim();

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

  // Title extraction: first heading or default
  const titleMatch = raw.match(/^#+\s*(.+)$/m);
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
    // Uppercase question labels: Q1, Question 1, 1.
    return /^(?:(?:\*\*|__)?(?:Q\d+|Question\s*\d+|\d+[\.\)])\b)/i.test(trimmed);
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
      q = q.replace(/^(?:(?:\*\*|__)?(?:Q\d+|Question\s*\d+|\d+[\.\)])\s*[-—–.:]?\s*)/i, '');
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
 * Removes the raw inline multiple choice text (e.g. "A) ... B) ...") from the rendered markdown
 * so the chat bubble only displays the clean question stem and the interactive card, eliminating
 * confusing horizontal duplicate text.
 */
export function stripRawOptionsFromMarkdown(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw;
  // Replace option sequences A) ... B) ... C) ... D) ...
  return raw.replace(/(?:^|\n|\s+)(?:A[\.\)]|\(A\))\s+[\s\S]*?(?=(?:\n\n|\n(?:(?:\*\*|__)?(?:Q\d+|Question\s*\d+|\d+[\.\)])\b)|$))/g, '\n');
}
