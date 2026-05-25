import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { prompt, duration = '5 seconds', cameraMovement = 'smooth', firstFrameImage } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Normalize duration: "5 сек" -> "5 seconds"
    const normalizedDuration = (duration || '5 seconds')
      .replace(/сек/gi, 'seconds')
      .replace(/мин/gi, 'minutes')
      .trim();

    const client = new GoogleGenAI({ apiKey });

    // Extract seconds from duration string
    const durationMatch = normalizedDuration.match(/(\d+)\s*seconds?/i);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1], 10) : 5;

    const generateParams: any = {
      model: 'veo-3.1-lite',
      prompt: `Generate a cinematic video scene. ${prompt}. Camera movement: ${cameraMovement}.`,
      config: {
        durationSeconds,
        numberOfVideos: 1,
      },
    };

    // Add first frame if provided
    if (firstFrameImage) {
      // If firstFrameImage is a URL string, fetch and convert to base64
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

    // Call video generation
    let operation = await client.models.generateVideos(generateParams);

    // Poll for completion (with timeout)
    const deadline = Date.now() + 10 * 60 * 1000; // 10 minute timeout
    while (!operation.done) {
      if (Date.now() > deadline) {
        return res.status(504).json({ error: 'Video generation timed out' });
      }
      await new Promise((r) => setTimeout(r, 3000)); // Wait 3 seconds before polling
      operation = await (client.operations as any).getVideosOperation({ operation });
    }

    const videos = (operation.response as any)?.generatedVideos ?? [];
    if (!videos.length) {
      return res.status(500).json({ error: 'No videos generated' });
    }

    // Return first video in format compatible with VideoGeneratorModule
    const video = videos[0];
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [
              {
                inline_data: {
                  data: video.video?.videoBytes || null,
                  mime_type: video.video?.mimeType || 'video/mp4',
                }
              }
            ]
          }
        }
      ]
    });
  } catch (err: any) {
    console.error('[/api/gemini/video]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate video' });
  }
}

