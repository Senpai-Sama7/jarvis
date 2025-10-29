import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, checkRateLimit } from "@/lib/groq-client";
import { sanitizeInput } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: string; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const body: ChatRequestBody = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Sanitize input
    const sanitizedMessage = sanitizeInput(body.message);

    if (sanitizedMessage.length === 0) {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Validate message length
    if (sanitizedMessage.length > 10000) {
      return NextResponse.json(
        { error: "Message too long. Maximum length is 10,000 characters." },
        { status: 400 }
      );
    }

    // Sanitize conversation history if provided
    const sanitizedHistory = body.history?.map((msg) => ({
      role: msg.role === "user" || msg.role === "assistant" ? msg.role : "user",
      content: sanitizeInput(msg.content),
    })) || [];

    // Get AI response
    const response = await getChatCompletion(sanitizedMessage, sanitizedHistory);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get chat response" },
      { status: 500 }
    );
  }
}
