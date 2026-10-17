/**
 * latexNormalizer.ts
 * ──────────────────
 * LaTeX and KaTeX AST pre-processor for Voltrix OS.
 * Normalizes and sanitizes LaTeX math syntax within raw Markdown strings:
 * - Converts \[ ... \] to $$ ... $$ (display math)
 * - Converts \( ... \) to $ ... $ (inline math)
 * - Wraps bare \begin{align|equation|matrix|gather|cases} blocks in $$ ... $$
 * - Restores accidentally unescaped LaTeX backslashes (\frac, \sqrt, \alpha, \sum, \int, etc.)
 * - Balances unclosed inline ($...$) or block ($$...$$) math tags during live LLM token streaming
 */

const COMMON_MACROS = [
  'frac', 'sqrt', 'text', 'mathrm', 'mathbf', 'mathbb', 'mathcal', 'boldsymbol', 'bm',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'sum', 'prod', 'int', 'iint', 'iiint', 'oint', 'partial', 'nabla', 'infty', 'forall', 'exists', 'nexists', 'in', 'notin', 'ni', 'subset', 'subseteq', 'supset', 'supseteq', 'cup', 'cap', 'setminus', 'land', 'lor', 'lnot', 'neg',
  'cdot', 'times', 'div', 'pm', 'mp', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 'approx', 'equiv', 'sim', 'simeq', 'propto', 'perp', 'parallel',
  'leftarrow', 'rightarrow', 'leftrightarrow', 'Leftarrow', 'Rightarrow', 'Leftrightarrow', 'to', 'mapsto', 'uparrow', 'downarrow',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'exp', 'det', 'dim', 'ker', 'deg', 'gcd', 'max', 'min', 'sup', 'inf', 'lim', 'limsup', 'liminf', 'arg', 'over', 'choose'
];

export function normalizeLatexMath(rawText: string = ''): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Convert LaTeX bracket notations to dollar signs for remark-math / rehype-katex
  // Display math: \[ ... \] -> $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => {
    return `\n$$\n${inner.trim()}\n$$\n`;
  });

  // Inline math: \( ... \) -> $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => {
    return `$${inner.trim()}$`;
  });

  // 2. Wrap bare LaTeX environments (\begin{aligned|align*?|equation*?|matrix|pmatrix|bmatrix|vmatrix|cases|gather*?})
  // if not already inside $$ ... $$ or $ ... $
  text = text.replace(/(?<!\$\$[\s\S]*?)(?<!\$[\s\S]*?)\\begin\{(align\*?|aligned|equation\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|cases)\}([\s\S]*?)\\end\{\1\}/g, (_match, env, inner) => {
    return `\n$$\n\\begin{${env}}${inner}\\end{${env}}\n$$\n`;
  });

  // 3. Fix control characters resulting from escape stripping (e.g. \b, \f, \t)
  text = text
    .replace(/[\x08]eta\b/g, '\\beta')
    .replace(/[\x08]ig\b/g, '\\Big')
    .replace(/[\x08]matrix\b/g, '\\bmatrix')
    .replace(/[\x08]boldsymbol\b/g, '\\boldsymbol')
    .replace(/[\x08]m\b/g, '\\bm')
    .replace(/[\x0c]rac\b/g, '\\frac')
    .replace(/[\x0c]orall\b/g, '\\forall')
    .replace(/[\t]au\b/g, '\\tau')
    .replace(/[\t]ext\b/g, '\\text')
    .replace(/[\t]heta\b/g, '\\theta')
    .replace(/[\t]imes\b/g, '\\times');

  // Fix bare macro keywords stripped of leading backslash inside math context ($frac{a}{b}$)
  text = text.replace(/(\$\$?)([\s\S]*?)(\$\$?)/g, (_match, openDelim, innerMath, closeDelim) => {
    let repaired = innerMath;
    for (const macro of COMMON_MACROS) {
      const bareMacroRegex = new RegExp(`(?<!\\\\)\\b(${macro})\\b(?=[{\\s_\\^\\(0-9A-Za-z])`, 'g');
      repaired = repaired.replace(bareMacroRegex, '\\$1');

      const quadMacroRegex = new RegExp(`\\\\\\\\(${macro})\\b`, 'g');
      repaired = repaired.replace(quadMacroRegex, '\\$1');
    }
    return `${openDelim}${repaired}${closeDelim}`;
  });

  // 4. Stream-safety: Automatically close dangling math delimiters during live streaming
  const doubleDollars = (text.match(/(?<!\\)\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    text = `${text}\n$$`;
  } else {
    const singleDollars = (text.replace(/(?<!\\)\$\$[\s\S]*?\$\$/g, '').match(/(?<!\\)\$/g) || []).length;
    if (singleDollars % 2 !== 0) {
      text = `${text}$`;
    }
  }

  return text;
}
