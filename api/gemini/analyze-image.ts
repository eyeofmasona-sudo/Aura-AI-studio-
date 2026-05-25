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
    const { imageData, mimeType, prompt } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || "Опиши этого персонажа детально (лицо, одежда, возраст, пол/раса, эмоция), чтобы можно было воссоздать его. Верни ответ в формате JSON: { \"gender\": \"male/female/animal/other\", \"age\": \"...\", \"appearance\": \"...\", \"outfit\": \"...\", \"emotion\": \"...\" }" },
            { 
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageData
              }
            }
          ]
        }
      ]
    });

    return res.json({ result: response.text });
  } catch (err: any) {
    console.error('[/api/gemini/analyze-image]', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze image' });
  }
}
