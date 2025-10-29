#!/usr/bin/env tsx
import Groq from "groq-sdk";
import fs from "fs";
import { exec, spawn, execFile } from "child_process";
import { promisify } from "util";
import readline from "readline";

const execAsync = promisify(exec);

import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let isRecording = false;
let currentRecordingProcess: any = null;

async function startRecording(outputFile: string) {
  console.log(`🎤 Recording... (Press ENTER to stop)`);
  isRecording = true;
  
  return new Promise<void>((resolve, reject) => {
    currentRecordingProcess = spawn('arecord', [
      '-f', 'cd',
      '-t', 'wav',
      outputFile
    ]);
    
    currentRecordingProcess.on('close', (code: number) => {
      isRecording = false;
      if (code === 0 || code === null) {
        console.log("✓ Recording complete");
        resolve();
      } else {
        reject(new Error(`Recording failed with code ${code}`));
      }
    });
    
    currentRecordingProcess.on('error', reject);
  });
}

function stopRecording() {
  if (currentRecordingProcess && isRecording) {
    currentRecordingProcess.kill('SIGINT');
  }
}

async function transcribe(audioFile: string): Promise<string> {
  console.log("🔄 Transcribing...");
  
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFile),
    model: "whisper-large-v3",
    response_format: "text",
    language: "en",
  });
  
  return transcription as unknown as string;
}

async function sendToGithubCopilot(prompt: string): Promise<string> {
  console.log("💭 Sending to GitHub Copilot...");
  
  // Send the transcribed text directly to gh CLI
  // This will interface with the current Copilot session
  try {
    const { stdout } = await execFile("gh", ["copilot", "suggest", "-t", "shell", prompt], { shell: true });
    return stdout;
  } catch (error: any) {
    // If that fails, try the API mode
    return "I heard: " + prompt + "\n\nPlease copy this text and paste it to me in the terminal.";
  }
}

async function speak(text: string) {
  // Extract just the text content, skip ANSI codes and special characters
  const cleanText = text
    .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI codes
    .replace(/[📝💭🔊✓]/g, '') // Remove emojis
    .slice(0, 500); // Limit length for TTS
  
  try {
    await execAsync(`which espeak-ng`);
    console.log("🔊 Speaking...");
    await execAsync(`espeak-ng "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`);
  } catch {
    console.log(text);
  }
}

async function main() {
  console.log("🎙️  Voice Assistant for GitHub Copilot");
  console.log("━".repeat(50));
  console.log("Press CTRL+C to exit\n");

  if (!process.env.GROQ_API_KEY) {
    console.error("FATAL: GROQ_API_KEY is not set in the environment.");
    console.error("Please create a .env file and add your API key:");
    console.error('GROQ_API_KEY="<your-key>"');
    process.exit(1);
  }

  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  while (true) {
    const audioFile = `/tmp/voice-input-${Date.now()}.wav`;
    
    try {
      // Start recording
      const recordingPromise = startRecording(audioFile);
      
      // Wait for user to press Enter
      await new Promise<void>((resolve) => {
        rl.question('', () => {
          stopRecording();
          resolve();
        });
      });
      
      await recordingPromise;
      
      // Check if file has content
      const stats = fs.statSync(audioFile);
      if (stats.size < 1000) {
        console.log("⚠️  Recording too short, skipping...\n");
        fs.unlinkSync(audioFile);
        continue;
      }
      
      // Transcribe
      const transcribedText = await transcribe(audioFile);
      console.log(`\n📝 You said: "${transcribedText}"\n`);
      
      // Save to a file that you can read in terminal
      const transcriptFile = '/tmp/copilot-voice-input.txt';
      fs.writeFileSync(transcriptFile, transcribedText);
      console.log(`💾 Saved to: ${transcriptFile}`);
      console.log(`📋 Copy and paste this to GitHub Copilot:\n`);
      console.log(`   ${transcribedText}\n`);
      
      // Cleanup
      fs.unlinkSync(audioFile);
      
      console.log("Ready for next recording...\n");
      
    } catch (error: any) {
      console.error("❌ Error:", error.message);
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }
    }
  }
}

// Handle exit
process.on('SIGINT', () => {
  console.log("\n\n👋 Goodbye!");
  process.exit(0);
});

main();
