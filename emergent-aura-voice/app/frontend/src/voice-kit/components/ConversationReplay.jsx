import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { History, Play, Pause, RefreshCw, Volume2, Wrench } from "lucide-react";
import { useVoice } from "../VoiceProvider";
import { apiUrl } from "../core/protocol";

const useReplayPlayer = (baseUrl) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  }, []);

  const play = useCallback((turn, startIndex = 0, single = false) => {
    stop();
    const playable = turn.sentences.filter((s) => s.audio_path);
    const step = (i) => {
      const sentence = playable[i];
      if (!sentence || (single && i > startIndex)) return stop();
      const audio = new Audio(apiUrl(baseUrl, `/agents/voice/audio/${sentence.audio_path}`));
      audioRef.current = audio;
      setPlaying({ turnId: turn.turn_id, index: sentence.index });
      audio.onended = () => audioRef.current === audio && step(i + 1);
      audio.onerror = () => audioRef.current === audio && step(i + 1);
      audio.play().catch(stop);
    };
    step(Math.max(0, playable.findIndex((s) => s.index >= startIndex)));
  }, [baseUrl, stop]);

  useEffect(() => stop, [stop]);
  return { playing, play, stop };
};

const TurnCard = ({ turn, player }) => {
  const isPlaying = player.playing?.turnId === turn.turn_id;
  return (
    <article data-testid={`replay-turn-${turn.turn_id}`} className="rounded-2xl border border-white/[0.07] bg-black/30 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <p className="text-sm text-cyan-300/90">{turn.user_text}</p>
        <button
          type="button"
          onClick={() => (isPlaying ? player.stop() : player.play(turn))}
          disabled={!turn.sentences.some((s) => s.audio_path)}
          data-testid={`replay-turn-play-${turn.turn_id}`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isPlaying ? "Stop" : "Replay"}
        </button>
      </div>
      <div className="space-y-1">
        {turn.sentences.map((s) => {
          const active = isPlaying && player.playing.index === s.index;
          return (
            <button
              key={s.index}
              type="button"
              onClick={() => player.play(turn, s.index, true)}
              disabled={!s.audio_path}
              data-testid={`replay-sentence-${turn.turn_id}-${s.index}`}
              data-active={active}
              className={`group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${active ? "bg-emerald-400/10 text-emerald-200" : "text-zinc-300 hover:bg-white/5"} ${s.filler ? "italic text-zinc-500" : ""}`}
            >
              <Volume2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${active ? "text-emerald-300" : "text-zinc-600 group-hover:text-zinc-300"}`} />
              <span>{s.text}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-600">
        <span>turn {turn.turn_id}</span>
        <span>· {turn.voice}</span>
        <span>· {new Date(turn.created_at).toLocaleString()}</span>
        {turn.interrupted && <span className="text-amber-400/80">· interrupted</span>}
        {turn.tools.map((t, i) => (
          <span key={`${t.name}-${i}`} className="inline-flex items-center gap-1 text-violet-300/80"><Wrench className="h-3 w-3" />{t.name}</span>
        ))}
      </div>
    </article>
  );
};

/** Saved conversation turns with sentence-by-sentence replay of the exact audio that was spoken. */
export const ConversationReplay = () => {
  const v = useVoice();
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(false);
  const player = useReplayPlayer(v.baseUrl);
  const supported = !v.connected || v.capabilities.includes("history");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl(v.baseUrl, "/agents/voice/conversations"), { params: { sessionId: v.sessionId, limit: 30 } });
      setTurns(data.turns || []);
    } catch {
      setTurns([]);
    } finally {
      setLoading(false);
    }
  }, [v.baseUrl, v.sessionId]);

  useEffect(() => {
    load();
  }, [load, v.historyVersion]);

  return (
    <section data-testid="conversation-replay-panel" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet-400/80">History / 03</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">Conversation replay</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-400">Every spoken sentence is saved. Replay a whole answer or tap one sentence to hear it exactly as it was said.</p>
        </div>
        <button type="button" onClick={load} data-testid="replay-refresh-button" className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {!supported ? (
        <p data-testid="replay-unsupported" className="rounded-2xl border border-white/[0.07] p-6 text-sm text-zinc-500">This backend doesn't store conversation audio. Switch to the preview backend to use replay.</p>
      ) : turns.length === 0 ? (
        <div data-testid="replay-empty" className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 p-8 text-sm text-zinc-500">
          <History className="h-4 w-4" /> No saved turns yet. Start voice mode and ask something.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2" data-testid="replay-turn-list">
          {turns.map((t) => <TurnCard key={t.turn_id} turn={t} player={player} />)}
        </div>
      )}
    </section>
  );
};
