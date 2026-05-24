import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { text, voiceName = 'Kore', speakingRate = 1.0 } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      } as any,
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('audio/')
    );
    if (!audioPart?.inlineData) return res.status(500).json({ error: 'No audio returned from TTS' });

    return res.json({ audioBase64: audioPart.inlineData.data, mimeType: audioPart.inlineData.mimeType });
  } catch (err: any) {
    console.error('[/api/generate/tts]', err);
    return res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
}
