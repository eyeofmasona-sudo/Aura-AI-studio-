import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Note: Vercel functions have max 300s execution on Pro plan.
// Veo generation can take 2-3 min, so this may timeout on Hobby.
export const maxDuration = 300;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { prompt, firstFrameBase64, firstFrameMime = 'image/jpeg', durationSeconds = 5, numberOfVideos = 1 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const ai = new GoogleGenAI({ apiKey });

    const params: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: { numberOfVideos, durationSeconds, generateAudio: false },
    };
    if (firstFrameBase64) {
      params.image = { imageBytes: firstFrameBase64, mimeType: firstFrameMime };
    }

    let operation = await ai.models.generateVideos(params);

    const deadline = Date.now() + 4 * 60 * 1000; // 4 min
    while (!operation.done) {
      if (Date.now() > deadline) return res.status(504).json({ error: 'Video generation timed out' });
      await new Promise(r => setTimeout(r, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videos = operation.response?.generatedVideos ?? [];
    if (!videos.length) return res.status(500).json({ error: 'No videos returned from Veo' });

    return res.json({
      videos: videos.map((v: any) => ({
        videoBase64: v.video?.videoBytes ?? null,
        mimeType: v.video?.mimeType ?? 'video/mp4',
        uri: v.video?.uri ?? null,
      })),
    });
  } catch (err: any) {
    console.error('[/api/generate/video]', err);
    return res.status(500).json({ error: err.message || 'Video generation failed' });
  }
}
