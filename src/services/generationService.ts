/**
 * generationService.ts
 * Единая точка вызова реальных AI-генераций:
 *   - Видео:   Veo 3.1 Lite
 *   - Кадры:   gemini-2.5-flash-image
 *   - Голос:   gemini-2.5-flash-preview-tts (Gemini TTS)
 *   - Музыка:  Lyria 3 Pro Preview
 */

const BASE = "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedVideo {
  videoBase64: string | null;
  mimeType: string;
  uri: string | null;
  /** browser-ready object URL, set by client after receiving response */
  objectUrl?: string;
}

export interface GeneratedImage {
  imageBase64: string | null;
  mimeType: string;
  /** browser-ready data URL: "data:<mime>;base64,<data>" */
  dataUrl?: string;
}

export interface GeneratedAudio {
  audioBase64: string | null;
  mimeType: string;
  /** browser-ready object URL */
  objectUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert File/Blob to base64 string (no data-url prefix) */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip "data:...;base64,"
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert base64 string + mimeType to an object URL for <video>/<audio> */
export function base64ToObjectUrl(base64: string, mimeType: string): string {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });
  return URL.createObjectURL(blob);
}

/** Convert base64 image to a data URL for <img> */
export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

// ─── Video — Veo 3.1 Lite ─────────────────────────────────────────────────────

export interface VideoGenOptions {
  prompt: string;
  firstFrameFile?: File | null;   // optional anchor image
  durationSeconds?: number;       // 5 | 8
  numberOfVideos?: number;
}

export async function generateVideo(opts: VideoGenOptions): Promise<GeneratedVideo[]> {
  let firstFrameBase64: string | undefined;
  let firstFrameMime: string | undefined;

  if (opts.firstFrameFile) {
    firstFrameBase64 = await fileToBase64(opts.firstFrameFile);
    firstFrameMime = opts.firstFrameFile.type || "image/jpeg";
  }

  const res = await fetch(`${BASE}/api/generate/video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      firstFrameBase64,
      firstFrameMime,
      durationSeconds: opts.durationSeconds ?? 5,
      numberOfVideos: opts.numberOfVideos ?? 1,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Video API error ${res.status}`);
  }

  const data = await res.json();
  return (data.videos as GeneratedVideo[]).map((v) => ({
    ...v,
    objectUrl: v.videoBase64
      ? base64ToObjectUrl(v.videoBase64, v.mimeType)
      : undefined,
  }));
}

// ─── Image — gemini-2.5-flash-image ──────────────────────────────────────────

export interface ImageGenOptions {
  prompt: string;
  numberOfImages?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
}

export async function generateImage(opts: ImageGenOptions): Promise<GeneratedImage[]> {
  const res = await fetch(`${BASE}/api/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      numberOfImages: opts.numberOfImages ?? 1,
      aspectRatio: opts.aspectRatio ?? "16:9",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Image API error ${res.status}`);
  }

  const data = await res.json();
  return (data.images as GeneratedImage[]).map((img) => ({
    ...img,
    dataUrl: img.imageBase64
      ? base64ToDataUrl(img.imageBase64, img.mimeType)
      : undefined,
  }));
}

// ─── TTS — gemini-2.5-flash-preview-tts ──────────────────────────────────────

/** Available prebuilt voice names */
export const TTS_VOICES = [
  { id: "Kore",    label: "Kore (нейтральный)" },
  { id: "Charon",  label: "Charon (глубокий мужской)" },
  { id: "Fenrir",  label: "Fenrir (энергичный мужской)" },
  { id: "Aoede",   label: "Aoede (нежный женский)" },
  { id: "Puck",    label: "Puck (лёгкий мужской)" },
] as const;

export type TtsVoiceName = typeof TTS_VOICES[number]["id"];

export interface TtsOptions {
  text: string;
  voiceName?: TtsVoiceName;
  speakingRate?: number; // 0.25 – 4.0
}

export async function generateTts(opts: TtsOptions): Promise<GeneratedAudio> {
  const res = await fetch(`${BASE}/api/generate/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: opts.text,
      voiceName: opts.voiceName ?? "Kore",
      speakingRate: opts.speakingRate ?? 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `TTS API error ${res.status}`);
  }

  const data = await res.json();
  return {
    audioBase64: data.audioBase64,
    mimeType: data.mimeType,
    objectUrl: data.audioBase64
      ? base64ToObjectUrl(data.audioBase64, data.mimeType)
      : undefined,
  };
}

// ─── Music — Lyria 3 Pro Preview ─────────────────────────────────────────────

export interface MusicGenOptions {
  prompt: string;
  durationSeconds?: number;
}

export async function generateMusic(opts: MusicGenOptions): Promise<GeneratedAudio> {
  const res = await fetch(`${BASE}/api/generate/music`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      durationSeconds: opts.durationSeconds ?? 30,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Music API error ${res.status}`);
  }

  const data = await res.json();
  return {
    audioBase64: data.audioBase64,
    mimeType: data.mimeType,
    objectUrl: data.audioBase64
      ? base64ToObjectUrl(data.audioBase64, data.mimeType)
      : undefined,
  };
}

// ─── Capabilities check ───────────────────────────────────────────────────────

export interface Capabilities {
  video:  { model: string; enabled: boolean };
  image:  { model: string; enabled: boolean };
  tts:    { model: string; enabled: boolean };
  music:  { model: string; enabled: boolean };
}

export async function fetchCapabilities(): Promise<Capabilities> {
  const res = await fetch(`${BASE}/api/capabilities`);
  return res.json();
}
