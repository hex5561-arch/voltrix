import { useState } from "react";
import { Cloud, FileCode2, TerminalSquare, Copy, Check } from "lucide-react";

const CLIENT_MSGS = ["ping", "set_voice", "user_text", "audio_chunk", "audio_end", "interrupt", "configure", "register_tools", "tool_result"];
const SERVER_MSGS = ["voice_status", "transcript", "transcript_partial", "transcript_chunk", "audio_chunk_stream", "audio", "interrupted", "tool_call", "tool_status"];
const DEPLOY_CMD = "cd cloudflare && yarn install && npx wrangler login && npx wrangler deploy";
const FILES = [
  ["src/VoiceAgent.ts", "Agent<Env, VoiceAgentState> Durable Object, lifecycle, pipeline, router"],
  ["src/index.ts", "Worker fetch(): /api/agents/voice → DO (101), /chat fail-safe"],
  ["src/workers-ai.ts", "Whisper ASR, Llama streaming + tool calling, MeloTTS / Aura-1"],
  ["src/sentence.ts", "Sentence chunker, /(?<=[.!?\\n])\\s+/, ≥ 4 words"],
  ["src/turn-queue.ts · waveform.ts", "Barge-in invalidation, 15–100% bar heights"],
  ["test/*.test.ts", "21 vitest specs: transitions, barge-in, streaming, tools, partials"],
  ["wrangler.jsonc", "AI binding, VOICE_AGENT DO, sqlite migration"],
];
const PIPELINE = ["mic → audio_chunk", "@cf/openai/whisper", "llama-3.3 stream", "sentence split", "aura-1 / melotts", "audio_chunk_stream"];

const Chip = ({ children, tone }) => (
  <span className={`rounded-md border px-2 py-1 font-mono text-[11px] ${tone === "in" ? "border-cyan-400/20 text-cyan-300" : "border-emerald-400/20 text-emerald-300"}`}>
    {children}
  </span>
);

const CopyCommand = () => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(DEPLOY_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" onClick={copy} data-testid="cloudflare-copy-deploy-command" className="group flex w-full items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-left font-mono text-xs text-amber-100 transition-colors hover:bg-amber-400/[0.08]">
      <span className="text-amber-500/70">$</span>
      <span className="flex-1 break-all">{DEPLOY_CMD}</span>
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-amber-300/60 group-hover:text-amber-200" />}
    </button>
  );
};

export const CloudflareInfo = ({ activeUrl }) => (
  <section data-testid="cloudflare-info-section" className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-400/80">Deploy target / 04</p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">Cloudflare Agents SDK project</h2>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Source lives in <code className="text-zinc-200">/app/cloudflare</code>. The same protocol runs this preview, so the frontend works unchanged against either backend once deployed.
        </p>
      </div>
      <span data-testid="cloudflare-status-badge" className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-300">
        <Cloud className="h-3.5 w-3.5" /> {activeUrl ? `live · ${activeUrl.replace(/^https?:\/\//, "")}` : "source · not deployed"}
      </span>
    </div>

    <div className="space-y-3" data-testid="cloudflare-deploy-guide">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">one-command deploy</p>
      <CopyCommand />
      <ol className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
        <li className="rounded-lg border border-white/[0.06] p-3"><span className="font-mono text-amber-300">1 ·</span> Run it from the project root. <code className="text-zinc-200">wrangler login</code> opens your browser once.</li>
        <li className="rounded-lg border border-white/[0.06] p-3"><span className="font-mono text-amber-300">2 ·</span> Copy the <code className="text-zinc-200">https://voice-agent.&lt;you&gt;.workers.dev</code> URL it prints.</li>
        <li className="rounded-lg border border-white/[0.06] p-3"><span className="font-mono text-amber-300">3 ·</span> Paste it into <span className="text-zinc-200">Voice backend → Cloudflare</span> in the sidebar and press Use.</li>
      </ol>
      <p className="text-[11px] text-zinc-600">Workers AI and SQLite Durable Objects are on the free plan. On Cloudflare, tools run once your app registers commands; web search and replay stay on the preview backend.</p>
    </div>

    <div className="flex flex-wrap items-center gap-2" data-testid="cloudflare-pipeline">
      {PIPELINE.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-zinc-300">{p}</span>
          {i < PIPELINE.length - 1 && <span className="text-zinc-600">→</span>}
        </div>
      ))}
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500"><FileCode2 className="h-3.5 w-3.5" /> files</p>
        <ul className="divide-y divide-white/5">
          {FILES.map(([f, d]) => (
            <li key={f} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <code className="shrink-0 font-mono text-sm text-zinc-100 sm:w-56">{f}</code>
              <span className="text-xs text-zinc-500">{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-5">
        <div className="glass-card rounded-2xl p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">client → agent</p>
          <div className="flex flex-wrap gap-2">{CLIENT_MSGS.map((m) => <Chip key={m} tone="in">{m}</Chip>)}</div>
          <p className="mb-3 mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">agent → client</p>
          <div className="flex flex-wrap gap-2">{SERVER_MSGS.map((m) => <Chip key={m}>{m}</Chip>)}</div>
        </div>
        <div className="glass-card rounded-2xl p-5 font-mono text-xs leading-6 text-zinc-300">
          <p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500"><TerminalSquare className="h-3.5 w-3.5" /> verify &amp; ship</p>
          <p><span className="text-zinc-600">$</span> yarn tsc --noEmit <span className="text-emerald-400"># 0 errors</span></p>
          <p><span className="text-zinc-600">$</span> yarn vitest run <span className="text-emerald-400"># 21 passed</span></p>
          <p><span className="text-zinc-600">$</span> npx wrangler deploy</p>
        </div>
      </div>
    </div>
  </section>
);
