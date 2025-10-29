"use client";

import { useState } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import ConversationHistory from "@/components/ConversationHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Github } from "lucide-react";
import { useTheme } from "next-themes";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { theme, setTheme } = useTheme();

  const handleNewMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      const history = [...messages, message];
      localStorage.setItem("conversation-history", JSON.stringify(history));
    }
  };

  const clearHistory = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("conversation-history");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              JARVIS
            </h1>
            <p className="text-muted-foreground mt-1">
              AI Voice Assistant powered by Groq
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <a
                href="https://github.com/Senpai-Sama7/jarvis"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Recorder - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Voice Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceRecorder onNewMessage={handleNewMessage} />
              </CardContent>
            </Card>
          </div>

          {/* Conversation History - Takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Conversation</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  disabled={messages.length === 0}
                >
                  Clear
                </Button>
              </CardHeader>
              <CardContent>
                <ConversationHistory messages={messages} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Groq AI
            </a>{" "}
            • Whisper & LLaMA 3.3
          </p>
        </div>
      </div>
    </main>
  );
}
