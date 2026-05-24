import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { prompt, numberOfImages = 1, aspectRatio = '16:9' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: { numberOfImages, aspectRatio, outputMimeType: 'image/jpeg' },
    });

    const images = (response.generatedImages ?? []).map((img: any) => ({
      imageBase64: img.image?.imageBytes ?? null,
      mimeType: img.image?.mimeType ?? 'image/jpeg',
    }));

    return res.json({ images });
  } catch (err: any) {
    console.error('[/api/generate/image]', err);
    return res.status(500).json({ error: err.message || 'Image generation failed' });
  }
}
