import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { prompt, duration = '5 seconds', cameraMovement = 'smooth', firstFrameImage } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const parts: any[] = [
      {
        text: `Generate a cinematic video scene. ${prompt}. Duration: ${duration}. Camera movement: ${cameraMovement}.`
      }
    ];

    if (firstFrameImage) {
      // If firstFrameImage is a URL string, fetch and convert to base64
      let imageData = firstFrameImage;
      if (typeof firstFrameImage === 'string' && firstFrameImage.startsWith('http')) {
        try {
          const imgResponse = await fetch(firstFrameImage);
          const buffer = await imgResponse.arrayBuffer();
          imageData = Buffer.from(buffer).toString('base64');
        } catch (e) {
          console.warn('Failed to fetch image, skipping:', e);
          imageData = null;
        }
      }

      if (imageData) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageData
          }
        });
      }
    }

    const requestBody = {
      contents: [{ role: 'user', parts }]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-lite-generate-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || response.statusText
      });
    }

    const data = await response.json();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[/api/gemini/video]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate video' });
  }
}

