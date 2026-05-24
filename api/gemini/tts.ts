import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, types } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { text, voiceName = 'Zephyr' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const client = new GoogleGenAI({ apiKey });
    const model = 'gemini-3.1-flash-tts-preview';

    const contents = [
      types.Content.fromText(text),
    ];

    const generateContentConfig = {
      temperature: 1,
      response_modalities: ['audio' as const],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: voiceName,
          },
        },
      },
    };

    let audioData: Buffer | null = null;
    let mimeType: string | null = null;

    const stream = await client.models.generateContentStream({
      model,
      contents,
      config: generateContentConfig,
    });

    for await (const chunk of stream) {
      if (chunk.parts && chunk.parts.length > 0) {
        const part = chunk.parts[0];
        if (part.inline_data && part.inline_data.data) {
          if (audioData === null) {
            // First chunk - initialize with data
            audioData = Buffer.from(part.inline_data.data, 'utf-8');
          } else {
            // Subsequent chunks - concatenate
            audioData = Buffer.concat([
              audioData,
              Buffer.from(part.inline_data.data, 'utf-8'),
            ]);
          }
          mimeType = part.inline_data.mime_type;
        }
      }
    }

    if (!audioData) {
      return res.status(500).json({ error: 'No audio data generated' });
    }

    // Return audio as base64
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({
      audio: audioData.toString('base64'),
      mimeType: mimeType || 'audio/wav',
    });
  } catch (err: any) {
    console.error('[/api/gemini/tts]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate audio' });
  }
}
