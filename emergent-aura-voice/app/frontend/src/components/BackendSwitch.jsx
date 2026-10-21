import { useCallback, useState } from "react";
import { Cloud, Server, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { DEFAULT_BASE_URL } from "@/voice-kit";

const MODE_KEY = "voice-backend-mode";
const URL_KEY = "voice-cf-url";

export const useBackendConfig = () => {
  const [mode, setModeState] = useState(() => localStorage.getItem(MODE_KEY) || "preview");
  const [cfUrl, setCfUrlState] = useState(() => localStorage.getItem(URL_KEY) || "");
  const setMode = useCallback((m) => {
    localStorage.setItem(MODE_KEY, m);
    setModeState(m);
  }, []);
  const setCfUrl = useCallback((u) => {
    const clean = u.trim().replace(/\/+$/, "");
    localStorage.setItem(URL_KEY, clean);
    setCfUrlState(clean);
  }, []);
  const baseUrl = mode === "cloudflare" && cfUrl ? cfUrl : DEFAULT_BASE_URL;
  return { mode, cfUrl, baseUrl, setMode, setCfUrl, isCloudflare: mode === "cloudflare" && Boolean(cfUrl) };
};

const ModeButton = ({ active, onClick, icon: Icon, children, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    data-active={active}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-colors ${active ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"}`}
  >
    <Icon className="h-3.5 w-3.5" /> {children}
  </button>
);

export const BackendSwitch = ({ config }) => {
  const [draft, setDraft] = useState(config.cfUrl);
  const [check, setCheck] = useState(null);

  const apply = async () => {
    if (!/^https?:\/\//.test(draft.trim())) {
      setCheck({ ok: false, msg: "Enter the full https:// Worker URL" });
      return;
    }
    setCheck({ loading: true });
    try {
      const res = await fetch(`${draft.trim().replace(/\/+$/, "")}/api/agents/voice`);
      const ok = res.status === 426 || res.ok;
      setCheck({ ok, msg: ok ? "Worker reachable" : `Unexpected HTTP ${res.status}` });
      if (ok) {
        config.setCfUrl(draft);
        config.setMode("cloudflare");
      }
    } catch {
      setCheck({ ok: false, msg: "Not reachable (check URL / CORS)" });
    }
  };

  return (
    <div data-testid="backend-switch" className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">voice backend</p>
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <ModeButton testId="backend-mode-preview" active={!config.isCloudflare} onClick={() => config.setMode("preview")} icon={Server}>Preview</ModeButton>
        <ModeButton testId="backend-mode-cloudflare" active={config.isCloudflare} onClick={() => (config.cfUrl ? config.setMode("cloudflare") : setCheck({ ok: false, msg: "Paste your Worker URL first" }))} icon={Cloud}>Cloudflare</ModeButton>
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://voice-agent.you.workers.dev"
          data-testid="backend-cf-url-input"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-amber-400/40 focus:outline-none"
        />
        <button type="button" onClick={apply} data-testid="backend-cf-connect-button" className="rounded-lg border border-amber-400/30 px-2.5 text-[11px] text-amber-300 transition-colors hover:bg-amber-400/10">
          Use
        </button>
      </div>
      {check && (
        <p data-testid="backend-check-status" className={`flex items-center gap-1.5 text-[11px] ${check.loading ? "text-zinc-400" : check.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {check.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : check.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {check.loading ? "Checking…" : check.msg}
        </p>
      )}
      <p data-testid="backend-active-url" className="truncate font-mono text-[10px] text-zinc-600">→ {config.baseUrl.replace(/^https?:\/\//, "")}</p>
    </div>
  );
};
