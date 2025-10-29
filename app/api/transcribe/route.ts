import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, checkRateLimit } from "@/lib/groq-client";
import { sanitizeInput } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip, 20, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.includes("audio") && !audioFile.type.includes("webm")) {
      return NextResponse.json(
        { error: "Invalid file type. Please provide an audio file." },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Transcribe the audio
    const text = await transcribeAudio(audioFile);

    // Sanitize the transcription
    const sanitizedText = sanitizeInput(text);

    return NextResponse.json({ text: sanitizedText });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
