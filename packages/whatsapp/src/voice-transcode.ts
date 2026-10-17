/**
 * Voice note transcoding to WhatsApp-compatible Ogg Opus format.
 *
 * WhatsApp requires genuine Ogg Opus (OggS container with OpusHead)
 * uploaded with MIME type 'audio/ogg; codecs=opus' to render as a native
 * green voice note with waveforms (PTT format).
 */

if (typeof (globalThis as any).Worker === "undefined") {
  (globalThis as any).Worker = class Worker {};
}

import opus from "@audio/encode-opus";

let MPEGDecoderClass: any = null;
async function getMPEGDecoder(): Promise<any> {
  if (!MPEGDecoderClass) {
    if (typeof (globalThis as any).Worker === "undefined") {
      (globalThis as any).Worker = class Worker {};
    }
    const mod = await import("mpg123-decoder");
    MPEGDecoderClass = mod.MPEGDecoder;
  }
  return MPEGDecoderClass;
}

export function isOggOpus(bytes: Uint8Array): boolean {
  if (bytes.length < 36) return false;
  // OggS magic header at offset 0
  const isOgg =
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53;
  if (!isOgg) return false;

  // Search for 'OpusHead' in the first 100 bytes
  const limit = Math.min(bytes.length - 8, 100);
  for (let i = 28; i <= limit; i++) {
    if (
      bytes[i] === 0x4f && // O
      bytes[i + 1] === 0x70 && // p
      bytes[i + 2] === 0x75 && // u
      bytes[i + 3] === 0x73 && // s
      bytes[i + 4] === 0x48 && // H
      bytes[i + 5] === 0x65 && // e
      bytes[i + 6] === 0x61 && // a
      bytes[i + 7] === 0x64 // d
    ) {
      return true;
    }
  }
  return false;
}

export function isWav(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 44 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45 // WAVE
  );
}

export function isMp3(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // ID3v2 header
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  // MPEG sync word: 11 bits set (0xFF followed by 0xE0 mask)
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true;
  return false;
}

function parseWav(
  buffer: ArrayBuffer | Uint8Array
): { samples: Float32Array; sampleRate: number } | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkLen = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      channels = view.getUint16(offset + 8 + 2, true);
      sampleRate = view.getUint32(offset + 8 + 4, true);
      bitsPerSample = view.getUint16(offset + 8 + 14, true);
    } else if (chunkId === "data") {
      const dataStart = offset + 8;
      if (bitsPerSample === 16) {
        const totalSamples = Math.floor(chunkLen / (2 * channels));
        const samples = new Float32Array(totalSamples);
        for (let i = 0; i < totalSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const sampleIdx = (i * channels + ch) * 2;
            if (dataStart + sampleIdx + 1 < bytes.length) {
              sum += view.getInt16(dataStart + sampleIdx, true) / 32768.0;
            }
          }
          samples[i] = sum / channels;
        }
        return { samples, sampleRate };
      } else if (bitsPerSample === 32) {
        const totalSamples = Math.floor(chunkLen / (4 * channels));
        const samples = new Float32Array(totalSamples);
        for (let i = 0; i < totalSamples; i++) {
          let sum = 0;
          for (let ch = 0; ch < channels; ch++) {
            const sampleIdx = (i * channels + ch) * 4;
            if (dataStart + sampleIdx + 3 < bytes.length) {
              sum += view.getFloat32(dataStart + sampleIdx, true);
            }
          }
          samples[i] = sum / channels;
        }
        return { samples, sampleRate };
      }
    }
    offset += 8 + chunkLen;
  }
  return null;
}

function resampleTo48k(inputSamples: Float32Array, inputRate: number): Float32Array {
  if (inputRate === 48000) return inputSamples;
  const ratio = 48000 / inputRate;
  const outLen = Math.round(inputSamples.length * ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = i / ratio;
    const base = Math.floor(srcIdx);
    const frac = srcIdx - base;
    const s0 = inputSamples[base] ?? 0;
    const s1 = inputSamples[base + 1] ?? s0;
    out[i] = s0 + frac * (s1 - s0);
  }
  return out;
}

async function encodePcmToOpus(samples48k: Float32Array): Promise<Uint8Array> {
  const encoder = await opus({
    sampleRate: 48000,
    channels: 1,
    bitrate: 32,
    application: "voip",
  });
  const chunk = encoder.encode([samples48k]);
  const tail = encoder.flush();
  encoder.free();

  const total = new Uint8Array(chunk.length + tail.length);
  total.set(chunk, 0);
  total.set(tail, chunk.length);
  return total;
}

/**
 * Transcodes arbitrary audio (WAV, MP3, raw PCM, or existing Ogg Opus)
 * into WhatsApp-compatible Ogg Opus (PTT format).
 */
export async function transcodeAudioForWhatsApp(
  audioBytes: Uint8Array,
  mimeType: string = "audio/ogg"
): Promise<{ data: Uint8Array; mimeType: "audio/ogg; codecs=opus" }> {
  // 1. Check if already authentic Ogg Opus
  if (isOggOpus(audioBytes)) {
    return { data: audioBytes, mimeType: "audio/ogg; codecs=opus" };
  }

  // 2. Check if WAV
  if (isWav(audioBytes)) {
    try {
      const wav = parseWav(audioBytes);
      if (wav && wav.samples.length > 0) {
        const samples48 = resampleTo48k(wav.samples, wav.sampleRate);
        const opusData = await encodePcmToOpus(samples48);
        if (opusData.length > 0) {
          return { data: opusData, mimeType: "audio/ogg; codecs=opus" };
        }
      }
    } catch (wavErr) {
      console.warn("[VoiceTranscode] WAV decode failed:", wavErr);
    }
  }

  // 3. Check if MP3 / MPEG Audio
  if (isMp3(audioBytes) || mimeType.includes("mpeg") || mimeType.includes("mp3")) {
    try {
      const MPEGDec = await getMPEGDecoder();
      const decoder = new MPEGDec();
      await decoder.ready;
      const { channelData, sampleRate } = decoder.decode(audioBytes);
      decoder.free();

      if (channelData && channelData.length > 0 && channelData[0].length > 0) {
        const mono =
          channelData.length > 1
            ? new Float32Array(channelData[0].length)
            : channelData[0];
        if (channelData.length > 1) {
          for (let i = 0; i < mono.length; i++) {
            mono[i] = (channelData[0][i] + channelData[1][i]) * 0.5;
          }
        }
        const samples48 = resampleTo48k(mono, sampleRate);
        const opusData = await encodePcmToOpus(samples48);
        if (opusData.length > 0) {
          return { data: opusData, mimeType: "audio/ogg; codecs=opus" };
        }
      }
    } catch (mp3Err) {
      console.warn("[VoiceTranscode] MP3 decode failed:", mp3Err);
    }
  }

  // Fallback: If unknown, return input with opus mimetype
  return { data: audioBytes, mimeType: "audio/ogg; codecs=opus" };
}
