"use client";

import { useState, useEffect, useCallback } from "react";
import VoiceRecorder from "@/components/VoiceRecorder";
import ConversationHistory from "@/components/ConversationHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Github, Download, Keyboard } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("conversation-history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        clearHistory();
      }
      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        exportConversation();
      }
      // Ctrl/Cmd + D to toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [messages, theme, setTheme]);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      localStorage.setItem("conversation-history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("conversation-history");
    toast.success("Conversation cleared");
  }, []);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const content = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  }, [messages]);

  const showShortcuts = () => {
    toast.info(
      "Keyboard Shortcuts:\n⌘/Ctrl + K: Clear\n⌘/Ctrl + E: Export\n⌘/Ctrl + D: Toggle Theme",
      { duration: 5000 }
    );
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
              onClick={showShortcuts}
              title="Keyboard Shortcuts"
            >
              <Keyboard className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={exportConversation}
              disabled={messages.length === 0}
              title="Export Conversation (⌘E)"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme (⌘D)"
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
                title="View on GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Recorder */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Voice Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceRecorder 
                  onNewMessage={handleNewMessage}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Conversation History */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Conversation
                  {messages.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({messages.length})
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  disabled={messages.length === 0}
                  title="Clear History (⌘K)"
                >
                  Clear
                </Button>
              </CardHeader>
              <CardContent>
                <ConversationHistory 
                  messages={messages}
                  isLoading={isLoading}
                />
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
