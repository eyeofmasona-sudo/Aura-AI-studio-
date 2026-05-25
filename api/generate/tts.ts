import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Gemini TTS returns raw PCM (audio/l16). Browsers need a WAV header to play it.
function pcmToWavBase64(pcmBase64: string, mimeType: string): string {
  const rateMatch = /rate=(\d+)/.exec(mimeType);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const pcm = Buffer.from(pcmBase64, 'base64');
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { text, voiceName = 'Kore', speakingRate = 1.0 } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const ai = new GoogleGenAI({ apiKey });
    const ttsModel = process.env.GOOGLE_AI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';
    const response = await ai.models.generateContent({
      model: ttsModel,
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

    const rawMime: string = audioPart.inlineData.mimeType || '';
    const isPcm = rawMime.includes('l16') || rawMime.includes('pcm');
    if (isPcm) {
      return res.json({ audioBase64: pcmToWavBase64(audioPart.inlineData.data, rawMime), mimeType: 'audio/wav' });
    }
    return res.json({ audioBase64: audioPart.inlineData.data, mimeType: rawMime });
  } catch (err: any) {
    console.error('[/api/generate/tts]', err);
    return res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
}
