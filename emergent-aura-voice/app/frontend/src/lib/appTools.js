const SECTIONS = ["voice", "studio", "history", "cloudflare"];
const PERSONA_IDS = ["zephyr", "orion", "sage", "coral", "echo"];

/** Commands this demo app exposes to the voice agent. `ui` is a ref filled in by the shell. */
export function buildAppTools(ui) {
  return {
    navigate_to_section: {
      description: "Scroll the app to a section: voice (home), studio (TTS Studio), history (conversation replay) or cloudflare (deploy info).",
      parameters: { type: "object", properties: { section: { type: "string", enum: SECTIONS } }, required: ["section"] },
      handler: async ({ section }) => {
        if (!SECTIONS.includes(section)) throw new Error(`Unknown section ${section}`);
        ui.current.minimize?.();
        setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
        return { ok: true, section };
      },
    },
    change_persona: {
      description: "Switch the assistant's voice persona.",
      parameters: { type: "object", properties: { persona: { type: "string", enum: PERSONA_IDS } }, required: ["persona"] },
      handler: async ({ persona }) => {
        if (!PERSONA_IDS.includes(persona)) throw new Error(`Unknown persona ${persona}`);
        ui.current.setVoice?.(persona);
        return { ok: true, persona, note: "New voice applies from the next reply." };
      },
    },
    take_note: {
      description: "Save a short note for the user in the app's notes list.",
      parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
      handler: async ({ text }) => ({ ok: true, count: ui.current.addNote?.(String(text).slice(0, 280)) }),
    },
    list_notes: {
      description: "Read back the user's saved notes.",
      parameters: { type: "object", properties: {} },
      handler: async () => ({ notes: (ui.current.getNotes?.() || []).map((n) => n.text) }),
    },
    set_studio_script: {
      description: "Put text into the TTS Studio script box, optionally with an OpenAI voice (alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer).",
      parameters: { type: "object", properties: { text: { type: "string" }, voice: { type: "string" } }, required: ["text"] },
      handler: async ({ text, voice }) => {
        ui.current.setScript?.({ text: String(text).slice(0, 4000), voice, nonce: Date.now() });
        return { ok: true };
      },
    },
  };
}
