import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GLOBAL_SYSTEM_PROMPT = `Ты — профессиональный AI-ассистент внутри студии видеопроизводства «Aura AI Studio».
Отвечай строго на русском языке, профессионально и конкретно.
Не добавляй вводных фраз. Давай только запрошенный результат.
Используй markdown-форматирование. Будь кинематографически точным.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const { actionName, inputs, specTitle, modelName, systemInstruction: customInstruction } = req.body;
    const targetModel = modelName || process.env.GOOGLE_AI_DEFAULT_MODEL || 'gemini-3.5-flash';

    if (targetModel.includes('veo') || targetModel.includes('lyria') || targetModel.includes('imagen')) {
      return res.status(400).json({ error: `Model ${targetModel} not supported here. Use dedicated endpoints.` });
    }

    let systemInstruction: string;
    if (customInstruction) {
      systemInstruction = customInstruction;
    } else if (actionName === 'Собрать финальный промпт' || actionName === 'Улучшить финальный промпт') {
      systemInstruction = GLOBAL_SYSTEM_PROMPT;
    } else {
      systemInstruction = `Ты — профессиональный AI-ассистент внутри студии видеопроизводства «Aura AI Studio».
Текущий модуль: «${specTitle}». Действие: «${actionName}».
Отвечай строго на русском языке, профессионально. Давай только результат без вводных фраз.
Используй markdown-форматирование, кинематографическую терминологию.`;
    }

    const userPrompt = `Действие: ${actionName}\n\nКонтекст проекта:\n${(inputs as string[]).map((inp, i) => `${i + 1}. ${inp}`).join('\n')}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: targetModel,
      config: { systemInstruction },
      contents: userPrompt,
    });

    return res.json({ result: response.text });
  } catch (err: any) {
    console.error('[/api/gemini/action]', err);
    return res.status(500).json({ error: err.message || 'Failed to generate content' });
  }
}
