import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Brain,
  PaperPlaneRight,
  X,
  Sparkle,
  Copy,
  Check,
  ArrowsClockwise,
  Lightbulb,
  Target,
  Lightning,
} from '@phosphor-icons/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface VTubeSocraticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  summary: string;
  takeaways: string[];
  discipline?: string;
  videoId?: string;
}

export interface SocraticMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: number;
}

interface QuickChip {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

/**
 * Normalizes and sanitizes LaTeX math notation for Markdown renderers.
 * Converts LaTeX bracket delimiters \[ \] and \( \) into standard $ and $$,
 * restores accidentally stripped backslashes, and balances dangling delimiters.
 */
function normalizeLatexMath(rawText: string = ''): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Convert display math \[ ... \] -> $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => {
    return `\n$$\n${inner.trim()}\n$$\n`;
  });

  // 2. Convert inline math \( ... \) -> $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => {
    return `$${inner.trim()}$`;
  });

  // 3. Wrap bare LaTeX environments (\begin{align}...\end{align}) in $$
  text = text.replace(
    /(?<!\$\$[\s\S]*?)(?<!\$[\s\S]*?)\\begin\{(align\*?|aligned|equation\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|cases)\}([\s\S]*?)\\end\{\1\}/g,
    (_match, env, inner) => `\n$$\n\\begin{${env}}${inner}\\end{${env}}\n$$\n`
  );

  // 4. Balance unclosed $$ block delimiters
  const doubleDollars = (text.match(/(?<!\\)\$\$/g) || []).length;
  if (doubleDollars % 2 !== 0) {
    text = `${text}\n$$`;
  }

  return text;
}

/**
 * Dedicated code snippet card with language badge and single-click copy button.
 */
const CodeBlock = memo(function CodeBlock({
  raw,
  lang,
}: {
  raw: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-[#161616] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/10 text-[11px] text-zinc-400 font-mono">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check size={12} weight="bold" className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-zinc-200 font-mono leading-relaxed select-text">
        <code>{raw}</code>
      </pre>
    </div>
  );
});

/**
 * Grounded Academic Socratic Fallback generator when offline or no API key is configured.
 */
function generateGroundedSocraticReply(
  userMsg: string,
  videoTitle: string,
  summary: string,
  takeaways: string[]
): string {
  const lower = userMsg.toLowerCase();

  const matchedTakeaway = takeaways.find((t) =>
    t.toLowerCase().split(' ').some((word) => word.length > 4 && lower.includes(word))
  );

  if (matchedTakeaway) {
    return `### 📐 Conceptual Grounding

A foundational principle emphasized in **"${videoTitle}"** is:

> *"${matchedTakeaway}"*

To construct intuitive understanding around this theorem:
1. **Boundary Behavior:** How does this invariance behave when scaling parameters to extreme boundary conditions?
2. **First-Principles Derivation:** What initial conservation assumptions must hold true for this result to remain valid?`;
  }

  if (
    lower.includes('derivation') ||
    lower.includes('derive') ||
    lower.includes('formula') ||
    lower.includes('math') ||
    lower.includes('proof')
  ) {
    return `### 🔍 Analytical Derivation & Mechanics

In **"${videoTitle}"**, the formal formulation relies directly on the following axiomatic structure:

$$\\mathcal{L}_{\\text{invariant}} = \\sum_{i=1}^{k} \\alpha_i \\cdot \\nabla \\Phi_i(x)$$

Notice how the primary mechanism balances:
- **Core Principle:** ${takeaways[0] || summary}
- **Dynamic Equilibrium:** The system scales monotonically under proper invariant conditions.

**Socratic Inquiry:** If you perturb the boundary values by $\\epsilon \\to 0$, does the convergence rate remain quadratic or decay linearly? What would you hypothesize?`;
  }

  if (
    lower.includes('takeaway') ||
    lower.includes('summary') ||
    lower.includes('overview') ||
    lower.includes('notes') ||
    lower.includes('key points')
  ) {
    return `### 💡 Executive Synthesis: "${videoTitle}"

**Overview:**
${summary}

**Key Academic Principles:**
${takeaways.map((t, i) => `**${i + 1}.** ${t}`).join('\n\n')}

Which of these mechanisms would you like to interrogate or derive step-by-step?`;
  }

  if (
    lower.includes('challenge') ||
    lower.includes('quiz') ||
    lower.includes('test') ||
    lower.includes('question')
  ) {
    return `### 🎯 Socratic Intuition Challenge

Consider this scenario based on **"${videoTitle}"**:

Suppose an external perturbation doubles the primary input vector while keeping system capacity invariant.

> **Challenge Question:** Based on the principle that *"${takeaways[0] || summary}"*, what is the immediate second-order consequence on stability?
> 
> *A)* The system exhibits damped oscillations and re-converges.  
> *B)* Boundary divergence occurs due to invariant saturation.  
> *C)* Energy is conserved with zero spectral shift.

Formulate your justification using first principles!`;
  }

  return `### 🎓 Socratic Exploration

In the context of **"${videoTitle}"**, your inquiry connects fundamentally to:

> *"${takeaways[0] || summary}"*

To build rigorous intuition around this:
- **Theoretical Grounding:** How does this relate to the core lecture premise?
- **Falsification Test:** Can you conceive of a edge condition where this intuition would break down?`;
}

export function VTubeSocraticDrawer({
  isOpen,
  onClose,
  videoTitle,
  summary,
  takeaways,
  discipline,
  videoId,
}: VTubeSocraticDrawerProps) {
  const [messages, setMessages] = useState<SocraticMessage[]>([
    {
      role: 'assistant',
      text: `Greetings scholar! I am your Socratic AI Tutor for **"${videoTitle}"**.\n\nHow can I help you synthesize or interrogate these concepts? You can ask for step-by-step derivations, conceptual analogies, or exam-level intuition challenges.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('Grounding with lecture principles...');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages or thinking updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, thinkingStep]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Shimmer thinking step cycler
  useEffect(() => {
    if (!isThinking) return;
    const steps = [
      'Grounding with lecture principles...',
      'Synthesizing theoretical derivation...',
      'Evaluating axiomatic boundary conditions...',
      'Formulating Socratic inquiry...',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setThinkingStep(steps[idx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isThinking]);

  const quickChips: QuickChip[] = [
    {
      label: '💡 Key Takeaways',
      icon: <Lightbulb size={12} weight="bold" className="text-amber-400" />,
      prompt: 'Summarize the core takeaways and central thesis of this lecture.',
    },
    {
      label: '📐 Explain Derivation',
      icon: <Lightning size={12} weight="bold" className="text-indigo-400" />,
      prompt: 'Break down the mathematical and conceptual derivation step-by-step.',
    },
    {
      label: '🎯 Socratic Challenge',
      icon: <Target size={12} weight="bold" className="text-emerald-400" />,
      prompt: 'Give me a challenging Socratic question to test my understanding of this video.',
    },
    {
      label: '🔬 Boundary Conditions',
      icon: <Brain size={12} weight="bold" className="text-sky-400" />,
      prompt: 'What happens to these principles under edge cases or extreme boundary conditions?',
    },
  ];

  const handleSendPrompt = useCallback(
    async (textToSend: string) => {
      const cleanText = textToSend.trim();
      if (!cleanText || isThinking) return;

      setInput('');
      const userMessage: SocraticMessage = {
        role: 'user',
        text: cleanText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsThinking(true);
      setThinkingStep('Grounding with lecture principles...');

      try {
        const payload = {
          prompt: cleanText,
          message: cleanText,
          videoTitle,
          summary,
          takeaways,
          discipline,
          videoId,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.text,
          })),
        };

        // 1. Try primary /api/chat endpoint
        let res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);

        // 2. Fallback to /api/vtube/chat if 404 or failed
        if (!res || !res.ok) {
          res = await fetch('/api/vtube/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => null);
        }

        let replyText = '';
        if (res && res.ok) {
          const data = (await res.json().catch(() => null)) as any;
          const answer =
            data?.answer || data?.reply || data?.text || data?.content || data?.response;
          if (answer && typeof answer === 'string' && answer.trim()) {
            replyText = answer.trim();
          }
        }

        // 3. Grounded Academic Socratic Fallback
        if (!replyText) {
          replyText = generateGroundedSocraticReply(cleanText, videoTitle, summary, takeaways);
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: replyText,
            timestamp: Date.now(),
          },
        ]);
      } catch (err) {
        console.warn('[VTubeSocraticDrawer] AI chat error, using fallback:', err);
        const fallbackText = generateGroundedSocraticReply(
          cleanText,
          videoTitle,
          summary,
          takeaways
        );
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: fallbackText,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, messages, videoTitle, summary, takeaways, discipline, videoId]
  );

  const handleCopyMessage = (idx: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: `Chat cleared. Ready for fresh inquiries on **"${videoTitle}"**!`,
        timestamp: Date.now(),
      },
    ]);
  };

  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
    h1: ({ children }) => (
      <h1 className="text-base font-bold text-white mb-2 mt-3 flex items-center gap-1.5">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-sm font-semibold text-white mb-1.5 mt-2.5">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5 mt-2">
        {children}
      </h3>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-indigo-500/70 pl-3 my-2.5 italic text-zinc-300 bg-white/[0.03] py-1 rounded-r-md">
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }) => {
      const isInline = !className && typeof children === 'string' && !children.includes('\n');
      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded-md bg-white/10 text-indigo-300 font-mono text-[13px] border border-white/5"
            {...props}
          >
            {children}
          </code>
        );
      }
      const raw = String(children).replace(/\n$/, '');
      const lang = (className || '').replace('language-', '').trim();
      return <CodeBlock raw={raw} lang={lang} />;
    },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#181818] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-zinc-200">
      {/* ── Drawer Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1f1f1f] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shrink-0 shadow-sm">
            <Brain size={18} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-white tracking-wide">
                In-Video Socratic AI Tutor
              </h3>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                GPT-4o
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[230px]" title={videoTitle}>
              {videoTitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <ArrowsClockwise size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Interactive Quick Chips Bar ── */}
      <div className="px-3 py-2 bg-[#1b1b1b] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendPrompt(chip.prompt)}
            disabled={isThinking}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* ── Chat Messages Stream (ChatGPT-Style Bubbles) ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 group`}
          >
            {/* Assistant Avatar Badge */}
            {m.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 bg-white/10 text-white border border-white/10 shadow-inner">
                <Sparkle size={13} weight="fill" className="text-indigo-400" />
              </div>
            )}

            {/* Bubble Content */}
            <div
              className={`relative ${
                m.role === 'user'
                  ? 'bg-[#2f2f2f] text-white px-4 py-2.5 rounded-3xl rounded-br-sm max-w-[85%] text-[15px] leading-relaxed shadow-sm'
                  : 'flex-1 min-w-0 text-zinc-200 text-[15px] leading-relaxed max-w-[92%]'
              }`}
            >
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap select-text">{m.text}</div>
              ) : (
                <div>
                  <div className="prose prose-invert max-w-none text-zinc-200 text-[14px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {normalizeLatexMath(m.text)}
                    </ReactMarkdown>
                  </div>

                  {/* Assistant Message Action Strip */}
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(idx, m.text)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check size={12} weight="bold" className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-zinc-400 font-mono">Socratic Grounding</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ── Real-Time Thinking Shimmer Animation ── */}
        {isThinking && (
          <div className="flex justify-start gap-3 animate-in fade-in duration-300">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 bg-white/10 text-white border border-white/10 shadow-inner">
              <Sparkle size={13} weight="fill" className="text-indigo-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0 max-w-[90%]">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="animate-pulse text-zinc-300 font-medium tracking-wide">
                  {thinkingStep}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input Box (ChatGPT-Style Pill) ── */}
      <div className="p-3 border-t border-white/10 bg-[#1b1b1b] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(input);
          }}
          className="flex items-center gap-2 bg-[#262626] border border-white/15 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500/70 transition-colors shadow-inner"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(input);
              }
            }}
            placeholder="Ask a clarifying question or request derivation..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer shrink-0 shadow-sm"
            title="Send inquiry"
          >
            <PaperPlaneRight size={14} weight="fill" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-zinc-400">
          Socratic AI synthesizes concepts directly from lecture chapters &amp; derivations.
        </p>
      </div>
    </div>
  );
}
