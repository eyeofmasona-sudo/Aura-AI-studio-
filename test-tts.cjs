const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("No API key set");
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });

async function testTTS() {
  try {
    const stream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: "Hello, this is a test audio generation." }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Zephyr",
            },
          },
        },
      },
    });

    console.log("Stream received");
    let hasAudio = false;
    for await (const chunk of stream) {
      console.log("Chunk received");
      const parts = chunk?.candidates?.[0]?.content?.parts ?? chunk?.parts ?? [];
      for (const part of parts) {
        if (part.text) {
          console.log("Text part:", part.text);
        }
        const inlineData = part?.inlineData ?? part?.inline_data;
        if (inlineData?.data) {
          hasAudio = true;
          console.log("Audio data part length:", inlineData.data.length);
        }
      }
    }
    
    if (!hasAudio) {
      console.log("Failed to find any audio data");
    } else {
      console.log("Audio data successfully found!");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testTTS();
