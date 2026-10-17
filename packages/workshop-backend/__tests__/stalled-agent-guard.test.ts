import { describe, it, expect } from "vitest";
import { detectStalledToolAnnouncement } from "../src/agent";

describe("Stalled Agent Tool Execution Guard", () => {
  it("detects user reported stall case 1: probe wave preamble", () => {
    const text = `Creating it properly — which means the video must showcase **real, measured results**, so first I fire all six Batch 3 probes (their outputs become the video's content — the narration clips, the matplotlib plot, and the transcription text you'll see on screen are themselves live test artifacts):

**Wave 1 — six probes, one parallel block:**`;

    expect(detectStalledToolAnnouncement(text)).toBe(true);
  });

  it("detects user reported stall case 2: apologetic preamble with no tools emitted", () => {
    const text = `You're right — I announced the wave three times and never actually fired it. My turns kept ending before the calls went out. Fixing that right now: here are all six probes, actually executing, in one parallel block — no more preamble:`;

    expect(detectStalledToolAnnouncement(text)).toBe(true);
  });

  it("detects conversational tool announcements ending in a colon", () => {
    expect(detectStalledToolAnnouncement("Executing the tools now:")).toBe(true);
    expect(detectStalledToolAnnouncement("Here are the probes in parallel:")).toBe(true);
    expect(detectStalledToolAnnouncement("Running the six tests now:")).toBe(true);
    expect(detectStalledToolAnnouncement("Firing all probes:")).toBe(true);
  });

  it("does not flag normal assistant responses that finish speaking to the user", () => {
    expect(detectStalledToolAnnouncement("I have completed the refactoring. All files have been updated.")).toBe(false);
    expect(detectStalledToolAnnouncement("Here is the solution to your calculus problem: $$f'(x) = 2x$$.")).toBe(false);
    expect(detectStalledToolAnnouncement("The server is listening on port 8788.")).toBe(false);
  });

  it("does not flag normal code explanations ending with code blocks", () => {
    const text = `To run the Python script, use the following command:
\`\`\`bash
python3 main.py
\`\`\``;
    expect(detectStalledToolAnnouncement(text)).toBe(false);
  });

  it("handles empty or whitespace-only strings safely", () => {
    expect(detectStalledToolAnnouncement("")).toBe(false);
    expect(detectStalledToolAnnouncement("   \n\t  ")).toBe(false);
  });

  it("detects tool announcements occurring inside internal reasoning thoughts", () => {
    const reasoningText = `The user wants me to run the six probes.
I will execute the six probes now: readAsset, deleteAsset, getRenderJobStatus, synthesizeSpeechBatch, transcribeAudio, runPython.
Running the six tests now:`;
    expect(detectStalledToolAnnouncement(reasoningText)).toBe(true);
  });
});
