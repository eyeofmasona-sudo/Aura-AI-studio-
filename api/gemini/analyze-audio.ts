import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { audioData, mimeType, prompt } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || "Проанализируй этот аудиофайл. Опиши его настроение, темп и атмосферу. Затем придумай креативную кинематографическую идею для видеоролика на основе этого аудио (сюжет, визуальный ряд)." },
            { 
              inlineData: {
                mimeType: mimeType || 'audio/mp3',
                data: audioData
              }
            }
          ]
        }
      ]
    });

    return res.json({ result: response.text });
  } catch (err: any) {
    console.error('[/api/gemini/analyze-audio]', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze audio' });
  }
}
