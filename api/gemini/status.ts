import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  res.json({ connected: !!apiKey, keyFound: !!apiKey, proxyWorking: true, error: apiKey ? null : 'API key missing' });
}
