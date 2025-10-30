"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/lib/utils";
import type { Message } from "@/app/page";
import { User, Bot } from "lucide-react";

interface ConversationHistoryProps {
  messages: Message[];
}

export default function ConversationHistory({
  messages,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("conversation-history");
      if (saved) {
        try {
          // Messages are managed by parent component
          // This is just for initial load
        } catch (error) {
          console.error("Error loading conversation history:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <Bot className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">No messages yet</p>
        <p className="text-sm text-center mt-2">
          Start a conversation by recording your voice
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div ref={scrollRef} className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            <div
              className={`flex flex-col max-w-[80%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
            {message.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
