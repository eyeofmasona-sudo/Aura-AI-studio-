import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function parseAudioMimeType(mimeType: string): { bitsPerSample: number; rate: number } {
  let bitsPerSample = 16;
  let rate = 24000;

  for (const rawParam of mimeType.split(';')) {
    const param = rawParam.trim();
    if (param.toLowerCase().startsWith('rate=')) {
      const value = Number.parseInt(param.split('=', 2)[1] ?? '', 10);
      if (!Number.isNaN(value)) rate = value;
      continue;
    }

    if (param.startsWith('audio/L')) {
      const value = Number.parseInt(param.split('L', 2)[1] ?? '', 10);
      if (!Number.isNaN(value)) bitsPerSample = value;
    }
  }

  return { bitsPerSample, rate };
}

function convertToWav(audioData: Buffer, mimeType: string): Buffer {
  const { bitsPerSample, rate } = parseAudioMimeType(mimeType);
  const numChannels = 1;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = rate * blockAlign;
  const dataSize = audioData.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, audioData]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { text, voiceName = 'Zephyr' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const client = new GoogleGenAI({ apiKey });

    const stream = await client.models.generateContentStream({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text }],
        },
      ],
      config: {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      } as any,
    });

    const audioChunks: Buffer[] = [];
    let mimeType = 'audio/L16;rate=24000';

    for await (const chunk of stream as any) {
      const part = chunk?.candidates?.[0]?.content?.parts?.[0] ?? chunk?.parts?.[0];
      const inlineData = part?.inlineData ?? part?.inline_data;
      if (!inlineData?.data) continue;

      audioChunks.push(Buffer.from(inlineData.data, 'base64'));
      mimeType = inlineData.mimeType ?? inlineData.mime_type ?? mimeType;
    }

    if (audioChunks.length === 0) {
      return res.status(500).json({ error: 'No audio data generated' });
    }

    let audioData = Buffer.concat(audioChunks);
    let finalMimeType = mimeType;

    if (mimeType.includes('audio/L') || (!mimeType.includes('wav') && !mimeType.includes('mp3') && !mimeType.includes('ogg'))) {
      audioData = convertToWav(audioData, mimeType);
      finalMimeType = 'audio/wav';
    }

    return res.status(200).json({
      audio: audioData.toString('base64'),
      mimeType: finalMimeType,
    });
  } catch (err: any) {
    console.error('[/api/gemini/tts]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate audio' });
  }
}
