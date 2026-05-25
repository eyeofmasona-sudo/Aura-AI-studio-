import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const enabled = !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
  res.json({
    video: { model: 'veo-3.1-lite-generate-preview', enabled },
    image: { model: 'gemini-2.5-flash-preview-05-20', enabled },
    tts:   { model: 'gemini-2.5-flash-preview-tts', enabled },
    music: { model: 'lyria-3-pro-preview', enabled },
  });
}
