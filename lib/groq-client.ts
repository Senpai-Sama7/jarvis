import Groq from "groq-sdk";

// Ensure this file is only used server-side
if (typeof window !== "undefined") {
  throw new Error("groq-client.ts should only be imported on the server side");
}

let groqInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqInstance) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }
    
    groqInstance = new Groq({
      apiKey: GROQ_API_KEY,
    });
  }
  
  return groqInstance;
}

/**
 * Transcribe audio using Groq's Whisper model
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const groq = getGroqClient();
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: process.env.WHISPER_MODEL || "whisper-large-v3",
      language: "en",
      response_format: "json",
    });

    return transcription.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Get chat completion from Groq's LLaMA model
 */
export async function getChatCompletion(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const groq = getGroqClient();
    const messages = [
      {
        role: "system",
        content:
          "You are JARVIS, an intelligent and helpful AI assistant. Provide clear, concise, and accurate responses. Be professional yet friendly.",
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error("Chat completion error:", error);
    throw new Error("Failed to get chat response");
  }
}

/**
 * Rate limiting helper
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
