import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 300;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { prompt, duration = '5 seconds', cameraMovement = 'smooth', firstFrameImage } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const normalizedDuration = (duration || '5 seconds')
      .replace(/сек/gi, 'seconds')
      .replace(/мин/gi, 'minutes')
      .trim();
    const durationMatch = normalizedDuration.match(/(\d+)\s*seconds?/i);
    // veo-3.1-lite only accepts even durations 4, 6, 8 — snap to nearest valid value
    const requested = durationMatch ? parseInt(durationMatch[1], 10) : 6;
    const durationSeconds = [4, 6, 8].reduce((a, b) => (Math.abs(b - requested) < Math.abs(a - requested) ? b : a), 6);

    const client = new GoogleGenAI({ apiKey });
    const videoModel = process.env.GOOGLE_AI_VIDEO_MODEL || 'veo-3.1-lite-generate-preview';

    const generateParams: any = {
      model: videoModel,
      prompt: `Generate a cinematic video scene. ${prompt}. Camera movement: ${cameraMovement}.`,
      config: { durationSeconds, numberOfVideos: 1 },
    };

    if (firstFrameImage) {
      let imageData = firstFrameImage;
      if (typeof firstFrameImage === 'string' && firstFrameImage.startsWith('http')) {
        try {
          const imgResponse = await fetch(firstFrameImage);
          const buffer = await imgResponse.arrayBuffer();
          imageData = Buffer.from(buffer).toString('base64');
        } catch (e) {
          console.warn('Failed to fetch image:', e);
          imageData = null;
        }
      } else if (typeof firstFrameImage === 'string' && firstFrameImage.startsWith('data:')) {
        imageData = firstFrameImage.split(',')[1];
      }
      if (imageData) {
        generateParams.image = { imageBytes: imageData, mimeType: 'image/jpeg' };
      }
    }

    let operation = await client.models.generateVideos(generateParams);

    const deadline = Date.now() + 4 * 60 * 1000;
    while (!operation.done) {
      if (Date.now() > deadline) return res.status(504).json({ error: 'Video generation timed out' });
      await new Promise((r) => setTimeout(r, 5000));
      operation = await (client.operations as any).getVideosOperation({ operation });
    }

    const videos = (operation.response as any)?.generatedVideos ?? [];
    if (!videos.length) return res.status(500).json({ error: 'No videos generated' });

    const video = videos[0];
    let videoBase64: string | null = video.video?.videoBytes ?? null;
    const mimeType = video.video?.mimeType || 'video/mp4';
    const uri: string | null = video.video?.uri ?? null;

    // Veo returns a download URI, not inline bytes. Fetch the bytes with the API key
    // so the browser (which has no key) can play the video.
    if (!videoBase64 && uri) {
      const dl = await fetch(uri, { headers: { 'x-goog-api-key': apiKey } });
      if (!dl.ok) return res.status(502).json({ error: `Failed to download video: ${dl.status}` });
      const buf = Buffer.from(await dl.arrayBuffer());
      videoBase64 = buf.toString('base64');
    }

    if (!videoBase64) return res.status(500).json({ error: 'No video content returned' });

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({
      candidates: [
        { content: { parts: [{ inline_data: { data: videoBase64, mime_type: mimeType } }] } },
      ],
    });
  } catch (err: any) {
    console.error('[/api/gemini/video]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate video' });
  }
}
