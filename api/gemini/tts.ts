import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, types } from '@google/genai';

function parseAudioMimeType(mimeType: string): { bitsPerSample: number; rate: number } {
  let bitsPerSample = 16;
  let rate = 24000;
  const parts = mimeType.split(';');
  for (const param of parts) {
    const p = param.trim();
    if (p.toLowerCase().startsWith('rate=')) {
      const val = parseInt(p.split('=')[1]);
      if (!isNaN(val)) rate = val;
    } else if (p.startsWith('audio/L')) {
      const val = parseInt(p.split('L')[1]);
      if (!isNaN(val)) bitsPerSample = val;
    }
  }
  return { bitsPerSample, rate };
}

function convertToWav(audioData: Buffer, mimeType: string): Buffer {
  const { bitsPerSample, rate } = parseAudioMimeType(mimeType);
  const numChannels = 1;
  const dataSize = audioData.length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = rate * blockAlign;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
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

    const contents = [
      types.Content.fromText(text),
    ];

    const config = {
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

    const audioChunks: Buffer[] = [];
    let mimeType = 'audio/L16;rate=24000';

    const stream = await client.models.generateContentStream({
      model: 'gemini-3.1-flash-tts-preview',
      contents,
      config,
    });

    for await (const chunk of stream) {
      if (!chunk.parts) continue;
      const part = chunk.parts[0];
      if (part?.inline_data?.data) {
        // inline_data.data is base64-encoded binary PCM audio
        audioChunks.push(Buffer.from(part.inline_data.data, 'base64'));
        if (part.inline_data.mime_type) {
          mimeType = part.inline_data.mime_type;
        }
      }
    }

    if (audioChunks.length === 0) {
      return res.status(500).json({ error: 'No audio data generated' });
    }

    let audioData = Buffer.concat(audioChunks);
    let finalMimeType = mimeType;

    // Convert raw PCM (audio/L16) to WAV with proper header
    if (mimeType.includes('audio/L') || !mimeType.includes('wav') && !mimeType.includes('mp3') && !mimeType.includes('ogg')) {
      audioData = convertToWav(audioData, mimeType);
      finalMimeType = 'audio/wav';
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({
      audio: audioData.toString('base64'),
      mimeType: finalMimeType,
    });
  } catch (err: any) {
    console.error('[/api/gemini/tts]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate audio' });
  }
}
