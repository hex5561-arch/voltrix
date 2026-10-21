import { useCallback, useRef } from "react";

const isMobile = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const FATAL = ["not-allowed", "service-not-allowed", "network"];

/** Browser SpeechRecognition for instant interim captions (desktop Chrome/Edge/Safari). */
export function useBrowserCaptions({ onCaption, isListening }) {
  const recRef = useRef(null);
  const cb = useRef({ onCaption, isListening });
  cb.current = { onCaption, isListening };

  const stop = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    try {
      rec?.stop();
    } catch (e) {
      console.debug("[voice-kit] speech recognition stop", e);
    }
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || isMobile() || recRef.current) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      if (text.trim() && cb.current.isListening()) cb.current.onCaption(text);
    };
    rec.onerror = (e) => {
      if (FATAL.includes(e.error)) recRef.current = null;
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      try {
        rec.start();
      } catch (e) {
        console.debug("[voice-kit] speech recognition restart skipped", e);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch (e) {
      recRef.current = null;
      console.warn("[voice-kit] speech recognition unavailable", e);
    }
  }, []);

  return { start, stop };
}
