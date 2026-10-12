import { useState, useRef, useEffect } from 'react';
import { Brain, PaperPlaneRight, X, Sparkle, User } from '@phosphor-icons/react';

interface VTubeSocraticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  summary: string;
  takeaways: string[];
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export function VTubeSocraticDrawer({
  isOpen,
  onClose,
  videoTitle,
  summary,
  takeaways,
}: VTubeSocraticDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Greetings scholar! I am your Socratic AI Tutor for "${videoTitle}". How can I help you synthesize or interrogate these concepts?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim() || isThinking) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    // Provide grounded academic reply synthesized with video takeaways
    setTimeout(() => {
      let reply = '';
      const lower = userMsg.toLowerCase();

      const matchedTakeaway = takeaways.find((t) =>
        t.toLowerCase().split(' ').some((word) => word.length > 4 && lower.includes(word))
      );

      if (matchedTakeaway) {
        reply = `A key principle directly emphasized in this lecture is:\n\n> "${matchedTakeaway}"\n\nTo build intuition on this: how does this concept apply if boundary conditions or scaling factors shift?`;
      } else if (lower.includes('summary') || lower.includes('overview')) {
        reply = `Summary breakdown for this lecture:\n\n${summary}\n\nKey Takeaways:\n${takeaways
          .map((t, i) => `${i + 1}. ${t}`)
          .join('\n')}`;
      } else {
        reply = `That is a fundamental question. In the context of "${videoTitle}", notice how:\n\n${
          takeaways[0] || summary
        }\n\nWhat would be your next logical derivation based on this theorem?`;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-kumo-base border-l border-kumo-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kumo-line bg-kumo-elevated">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kumo-brand/15 text-kumo-brand">
            <Brain size={16} weight="bold" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-kumo-default">In-Video Socratic AI Tutor</h3>
            <p className="text-[11px] text-kumo-subtle truncate max-w-[240px]">{videoTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-kumo-tint text-kumo-subtle hover:text-kumo-default transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kumo-brand text-white flex-shrink-0 mt-0.5">
                <Sparkle size={12} weight="fill" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-kumo-brand text-white'
                  : 'bg-kumo-elevated border border-kumo-line text-kumo-default'
              }`}
            >
              {m.text}
            </div>
            {m.role === 'user' && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kumo-tint text-kumo-default flex-shrink-0 mt-0.5">
                <User size={12} />
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-2.5 items-center text-xs text-kumo-subtle italic">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-kumo-brand text-white flex-shrink-0 animate-spin">
              <Sparkle size={12} />
            </div>
            <span>Synthesizing lecture takeaways...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-kumo-line bg-kumo-base flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask a clarifying question or request derivation..."
          className="flex-1 px-3 py-2 rounded-lg border border-kumo-line bg-kumo-elevated text-xs text-kumo-default placeholder:text-kumo-inactive focus:outline-none focus:border-kumo-ring"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-kumo-brand text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex-shrink-0"
        >
          <PaperPlaneRight size={14} weight="fill" />
        </button>
      </div>
    </div>
  );
}
