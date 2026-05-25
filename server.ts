import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { GLOBAL_SYSTEM_PROMPT } from "./systemPrompt.js";

dotenv.config();

// Gemini TTS returns raw PCM (audio/l16). Browsers need a WAV header to play it.
function pcmToWavBase64(pcmBase64: string, mimeType: string): string {
  const rateMatch = /rate=(\d+)/.exec(mimeType);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const pcm = Buffer.from(pcmBase64, "base64");
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check for API key
  const effectiveApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!effectiveApiKey) {
    console.warn("WARNING: Neither GOOGLE_AI_API_KEY nor GEMINI_API_KEY environment variable is set. API calls will fail.");
  }

  const ai = new GoogleGenAI({
    apiKey: effectiveApiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Status API Endpoint
  app.get("/api/gemini/status", (req, res) => {
    res.json({
      connected: !!effectiveApiKey,
      keyFound: !!effectiveApiKey,
      proxyWorking: true,
      error: effectiveApiKey ? null : "API key is missing in server environment variables"
    });
  });

  // API routes
  app.post("/api/gemini/action", async (req, res) => {
    try {
      const { actionName, inputs, specTitle, modelName, systemInstruction: customInstruction } = req.body;
      const targetModel = modelName || process.env.GOOGLE_AI_DEFAULT_MODEL || "gemini-3.5-flash";
      
      let systemInstruction = customInstruction || `You are a creative assistant inside an AI Video Studio.
The user is currently on the module step: "${specTitle}".
They clicked the action button: "${actionName}".
The available context inputs are: ${inputs.join(', ')}.

CRITICAL INSTRUCTIONS:
- You are a direct output content generator. Output ONLY the raw content, details, or requested specifications.
- Do NOT write any conversational fillers, greetings, introductions, or preambles (e.g., "Инструмент успешно...", "Ниже представлен...", "Aura AI Studio...").
- Do NOT write any concluding remarks or post-generation explanations.
- Do NOT include any decorative markdown headers at the top (such as "# Анатомический паспорт...", "# Описание...") or horizontal lines ("---") at the beginning or end.
- Return only the actual visual or narrative details appropriate to be placed directly into a text field.`;

      if (!customInstruction) {
        if (actionName === "Собрать финальный промпт" || actionName === "Улучшить финальный промпт") {
          systemInstruction = GLOBAL_SYSTEM_PROMPT;
        } else if (actionName === "Улучшить идею") {
          systemInstruction = `You are a professional Creative Director inside Aura AI Studio. Your job is to improve the user's creative video/movie idea to make it deeper, more compelling, and emotionally resonant.

CRITICAL RULES:
1. Output ONLY the improved/rewritten idea text.
2. The output MUST be a direct narrative description of 1 to 2 paragraphs.
3. Do NOT output a full script, camera movements, characters lists, scene prompt blocks, or negative instructions.
4. Do NOT include any markdown headers, bold sections, or separators (no "#", "###", "---").
5. Keep it strictly focused on the core story narrative, premise, emotional themes, and message.
6. Absolutely no conversational fillers, greetings, introductions, or concluding explanations (e.g., "Ниже представлен...", "Вот улучшенная..."). Just output the raw improved idea text itself.`;
        } else if (actionName === "Сделать кинематографичнее") {
          systemInstruction = `You are an elite Cinematographer. Your job is to take the user's idea and rewrite it to be far more cinematic, sensory, and visually striking.

CRITICAL RULES:
1. Output ONLY the cinematic descriptive text.
2. The output MUST be a direct narrative description of scenes, atmosphere, textures, lighting, and camera motion in 1 to 2 paragraphs.
3. Do NOT output shot-by-shot lists, screenplay formats, character dossiers, or visual prompt lists.
4. Do NOT include markdown headers, titles, or bullet sections (no "#", "###", "---").
5. Focus on the mood, lighting, camera angles, shadows, colors, and sensory atmosphere.
6. Absolutely no conversational fillers, intro words, or explanations. Just output the raw cinemized text representation.`;
        } else if (actionName === "Развернуть в концепт") {
          systemInstruction = `You are a Producer and Script Architect. Your job is to expand the user's raw idea into a rich, detailed creative concept statement.

CRITICAL RULES:
1. Output ONLY the descriptive concept statement in 2 to 3 paragraphs.
2. Do NOT output a shot-by-shot script, full characters lists, scene prompt blocks, or negative instructions.
3. Keep the text clean. Do NOT use markdown headers or title lines (no "#", "###", "---").
4. Outline the main hook, central conflict, stylistic approach, and emotional pacing.
5. Absolutely no conversational dialogue, fillers, or metadata. Just output the clean concept description.`;
        } else if (actionName === "Предложить 5 похожих идей") {
          systemInstruction = `You are a Creative Brainstormer. Your job is to suggest 5 unique, compelling alternative premises or variants similar to the user's theme.

CRITICAL RULES:
1. Output ONLY a clean numbered list with exactly 5 items.
2. Each item must be a short, intriguing premise (1 to 2 sentences maximum).
3. Do NOT use markdown headers, bold main section titles, or horizontal dividers (no "#", "---").
4. Absolutely no conversational intros, greetings, or conclusions. Start directly with "1. "`;
        } else if (actionName === "Создать логлайн") {
          systemInstruction = `You are an expert Hollywood Screenwriter. Your job is to write a highly polished, single-sentence logline based on the user's idea and details.

CRITICAL RULES:
1. Output strictly ONE single sentence.
2. The sentence must include a protagonist/central force, a clear goal, a major obstacle, and high emotional or dramatic stakes.
3. Do NOT wrap the output in quotes. Do NOT use markdown headers, list markers, or bullet points.
4. Absolutely no intros, notes, or outro remarks. Output only the raw sentence.`;
        } else if (actionName === "Создать синопсис") {
          systemInstruction = `You are a professional Story Editor. Your job is to write a compelling, cohesive synopsis based on the user's idea.

CRITICAL RULES:
1. Output exactly 2 or 3 short narrative paragraphs representing a clear dramatic arc: setup, development/climax, and main emotional takeaway or resolution.
2. Do NOT write bullet points, shot lists, character names with descriptions, or scene lists.
3. Do NOT use markdown headers, dividers, or subtitles (no "#", "###", "---").
4. Absolutely no intro/outro conversational text. Output only the paragraphs of the synopsis.`;
        } else if (actionName === "Создать мудборд") {
          systemInstruction = `You are a professional Art Director. Your job is to generate a set of highly specific visual and aesthetic tags/keywords for the project's moodboard.

CRITICAL RULES:
1. Output ONLY a comma-separated list of 5 to 8 aesthetic words/tags/keywords (in Russian or English). E.g.: "тёмный неон, кинематографичный контраст, густой дым, холодный синий, анаморфные блики".
2. Do NOT write sentences, paragraphs, headers, lists, or any other explanations.
3. Absolutely no intros or outros. Just the raw keywords separated by commas on a single line.`;
        }
      }

      const userPrompt = `Действие: ${actionName}\n\nКонтекст проекта:\n${(inputs as string[]).map((inp, i) => `${i + 1}. ${inp}`).join('\n')}`;


      // Standard Text GenerateContent
      const response = await ai.models.generateContent({
        model: targetModel,
        config: { systemInstruction },
        contents: userPrompt,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini route error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });


  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO GENERATION (UI route) — Veo 3.1 Lite, returns inline base64
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/gemini/video", async (req, res) => {
    try {
      if (!effectiveApiKey) return res.status(500).json({ error: "API key missing" });
      const { prompt, duration = "5 seconds", cameraMovement = "smooth", firstFrameImage } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const normalizedDuration = String(duration).replace(/сек/gi, "seconds").replace(/мин/gi, "minutes").trim();
      const durationMatch = normalizedDuration.match(/(\d+)\s*seconds?/i);
      // veo-3.1-lite only accepts even durations 4, 6, 8 — snap to nearest valid value
      const requested = durationMatch ? parseInt(durationMatch[1], 10) : 6;
      const durationSeconds = [4, 6, 8].reduce((a, b) => (Math.abs(b - requested) < Math.abs(a - requested) ? b : a), 6);

      const videoModel = process.env.GOOGLE_AI_VIDEO_MODEL || "veo-3.1-lite-generate-preview";
      const params: any = {
        model: videoModel,
        prompt: `Generate a cinematic video scene. ${prompt}. Camera movement: ${cameraMovement}.`,
        config: { durationSeconds, numberOfVideos: 1 },
      };
      if (firstFrameImage && typeof firstFrameImage === "string") {
        const imageBytes = firstFrameImage.startsWith("data:") ? firstFrameImage.split(",")[1] : firstFrameImage;
        if (!firstFrameImage.startsWith("http")) params.image = { imageBytes, mimeType: "image/jpeg" };
      }

      let operation = await ai.models.generateVideos(params);
      const deadline = Date.now() + 4 * 60 * 1000;
      while (!operation.done) {
        if (Date.now() > deadline) return res.status(504).json({ error: "Video generation timed out" });
        await new Promise((r) => setTimeout(r, 5000));
        operation = await (ai.operations as any).getVideosOperation({ operation });
      }

      const videos = (operation.response as any)?.generatedVideos ?? [];
      if (!videos.length) return res.status(500).json({ error: "No videos generated" });

      const video = videos[0];
      let videoBase64: string | null = video.video?.videoBytes ?? null;
      const mimeType = video.video?.mimeType || "video/mp4";
      const uri: string | null = video.video?.uri ?? null;

      if (!videoBase64 && uri) {
        const dl = await fetch(uri, { headers: { "x-goog-api-key": effectiveApiKey } });
        if (!dl.ok) return res.status(502).json({ error: `Failed to download video: ${dl.status}` });
        videoBase64 = Buffer.from(await dl.arrayBuffer()).toString("base64");
      }
      if (!videoBase64) return res.status(500).json({ error: "No video content returned" });

      res.json({ candidates: [{ content: { parts: [{ inline_data: { data: videoBase64, mime_type: mimeType } }] } }] });
    } catch (err: any) {
      console.error("[/api/gemini/video]", err);
      res.status(500).json({ error: err.message || "Failed to generate video" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO GENERATION — Veo 3.1 Lite
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/generate/video", async (req, res) => {
    try {
      if (!effectiveApiKey) return res.status(500).json({ error: "API key missing" });
      const { prompt, firstFrameBase64, firstFrameMime = "image/jpeg", durationSeconds = 5, numberOfVideos = 1 } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });

      const videoModel = process.env.GOOGLE_AI_VIDEO_MODEL || "veo-3.1-lite-generate-preview";
      const params: any = {
        model: videoModel,
        prompt,
        config: { numberOfVideos, durationSeconds },
      };
      if (firstFrameBase64) {
        params.image = { imageBytes: firstFrameBase64, mimeType: firstFrameMime };
      }

      let operation = await ai.models.generateVideos(params);
      const deadline = Date.now() + 3 * 60 * 1000;
      while (!operation.done) {
        if (Date.now() > deadline) return res.status(504).json({ error: "Video generation timed out" });
        await new Promise((r) => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const videos = operation.response?.generatedVideos ?? [];
      if (!videos.length) return res.status(500).json({ error: "No videos returned from Veo" });

      res.json({
        videos: videos.map((v: any) => ({
          videoBase64: v.video?.videoBytes ?? null,
          mimeType: v.video?.mimeType ?? "video/mp4",
          uri: v.video?.uri ?? null,
        })),
      });
    } catch (err: any) {
      console.error("[/api/generate/video]", err);
      res.status(500).json({ error: err.message || "Video generation failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE GENERATION — gemini-2.5-flash-preview-05-20
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/generate/image", async (req, res) => {
    try {
      if (!effectiveApiKey) return res.status(500).json({ error: "API key missing" });
      const { prompt, numberOfImages = 1, aspectRatio = "16:9" } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });

      const imageModel = process.env.GOOGLE_AI_IMAGE_MODEL || "gemini-2.5-flash-image";
      const response = await ai.models.generateImages({
        model: imageModel,
        prompt,
        config: { numberOfImages, aspectRatio, outputMimeType: "image/jpeg" },
      });

      res.json({
        images: (response.generatedImages ?? []).map((img: any) => ({
          imageBase64: img.image?.imageBytes ?? null,
          mimeType: img.image?.mimeType ?? "image/jpeg",
        })),
      });
    } catch (err: any) {
      console.error("[/api/generate/image]", err);
      res.status(500).json({ error: err.message || "Image generation failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TTS — gemini-2.5-flash-preview-tts
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/generate/tts", async (req, res) => {
    try {
      if (!effectiveApiKey) return res.status(500).json({ error: "API key missing" });
      const { text, voiceName = "Kore", speakingRate = 1.0 } = req.body;
      if (!text) return res.status(400).json({ error: "text is required" });

      const ttsModel = process.env.GOOGLE_AI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ role: "user", parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        } as any,
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (!audioPart?.inlineData) return res.status(500).json({ error: "No audio returned from TTS model" });

      const rawMime: string = audioPart.inlineData.mimeType || "";
      if (rawMime.includes("l16") || rawMime.includes("pcm")) {
        res.json({ audioBase64: pcmToWavBase64(audioPart.inlineData.data, rawMime), mimeType: "audio/wav" });
      } else {
        res.json({ audioBase64: audioPart.inlineData.data, mimeType: rawMime });
      }
    } catch (err: any) {
      console.error("[/api/generate/tts]", err);
      res.status(500).json({ error: err.message || "TTS generation failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // MUSIC GENERATION — lyria-3-pro-preview
  // ─────────────────────────────────────────────────────────────────────────
  app.post("/api/generate/music", async (req, res) => {
    try {
      if (!effectiveApiKey) return res.status(500).json({ error: "API key missing" });
      const { prompt, durationSeconds = 30 } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });

      const musicModel = process.env.GOOGLE_AI_MUSIC_MODEL || "lyria-3-pro-preview";
      const response = await ai.models.generateContent({
        model: musicModel,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: ["AUDIO"] } as any,
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (!audioPart?.inlineData) return res.status(500).json({ error: "No audio returned from Lyria" });

      res.json({ audioBase64: audioPart.inlineData.data, mimeType: audioPart.inlineData.mimeType });
    } catch (err: any) {
      console.error("[/api/generate/music]", err);
      res.status(500).json({ error: err.message || "Music generation failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CAPABILITIES
  // ─────────────────────────────────────────────────────────────────────────
  app.get("/api/capabilities", (_req, res) => {
    res.json({
      video: { model: process.env.GOOGLE_AI_VIDEO_MODEL || "veo-3.1-lite-generate-preview", enabled: !!effectiveApiKey },
      image: { model: process.env.GOOGLE_AI_IMAGE_MODEL || "gemini-2.5-flash-image", enabled: !!effectiveApiKey },
      tts:   { model: process.env.GOOGLE_AI_TTS_MODEL || "gemini-3.1-flash-tts-preview", enabled: !!effectiveApiKey },
      music: { model: process.env.GOOGLE_AI_MUSIC_MODEL || "lyria-3-pro-preview", enabled: !!effectiveApiKey },
    });
  });

    // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
