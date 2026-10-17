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
 * Handles both inline ("A) 5.1 m  B) 10.2 m") and multiline ("A. ...\nB. ...").
 */
function extractOptionsFromText(text: string): { question: string; options: string[] } | null {
  const matchA = text.search(/(?:^|\s)(?:A[\.\)]|\(A\))\s/i);
  if (matchA === -1) return null;

  const question = text.slice(0, matchA).trim();
  const optionsText = text.slice(matchA).trim();

  const regex = /(?:^|\s+)(?:([A-F])[\.\)]|\(([A-F])\))\s+/gi;
  const splits: Array<{ letter: string; index: number; matchLen: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(optionsText)) !== null) {
    splits.push({
      letter: (m[1] || m[2]).toUpperCase(),
      index: m.index,
      matchLen: m[0].length,
    });
  }

  if (splits.length < 2) return null;

  const options: string[] = [];
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].index + splits[i].matchLen;
    const end = i + 1 < splits.length ? splits[i + 1].index : optionsText.length;
    options.push(optionsText.slice(start, end).trim());
  }

  return { question, options };
}

/**
 * Automatically extracts multiple-choice questions from standard Markdown text.
 * Returns null if no valid multiple-choice questions are found.
 */
export function parseMarkdownQuiz(raw: string): ParsedQuizData | null {
  if (!raw || typeof raw !== 'string') return null;

  // If already tagged with an explicit quiz code block, do not double-render
  if (/```(?:quiz|assessment|test)\b/i.test(raw)) return null;

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
    if (res && res.options.length >= 2) {
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
