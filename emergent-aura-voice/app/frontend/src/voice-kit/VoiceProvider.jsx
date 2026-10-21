import { createContext, useContext, useMemo } from "react";
import { useVoiceInteraction } from "./useVoiceInteraction";
import { DEFAULT_BASE_URL, getSessionId } from "./core/protocol";

const VoiceContext = createContext(null);

/**
 * Wrap any part of a host app to share one voice session.
 * - baseUrl: backend origin (preview FastAPI or the deployed Cloudflare Worker)
 * - tools: { [name]: { description, parameters, handler(args) } } commands the agent may run in your app
 */
export const VoiceProvider = ({ children, baseUrl = DEFAULT_BASE_URL, sessionId, tools, partialCaptions = true, initialVoice }) => {
  const sid = useMemo(() => sessionId || getSessionId(), [sessionId]);
  const voice = useVoiceInteraction({ sessionId: sid, baseUrl, tools, partialCaptions, initialVoice });
  return <VoiceContext.Provider value={{ ...voice, sessionId: sid }}>{children}</VoiceContext.Provider>;
};

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used inside <VoiceProvider>");
  return ctx;
};
