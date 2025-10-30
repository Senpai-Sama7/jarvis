"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/utils";
import type { Message } from "@/app/page";
import { User, Bot, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConversationHistoryProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function ConversationHistory({
  messages,
  isLoading,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const renderContent = (content: string) => {
    // Simple code block detection
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }

      // Add code block
      parts.push({
        type: "code",
        language: match[1] || "text",
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    if (parts.length === 0) {
      return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
    }

    return (
      <div className="space-y-2">
        {parts.map((part, idx) =>
          part.type === "code" ? (
            <div key={idx} className="relative group">
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(part.content, idx)}
                >
                  {copiedIndex === idx ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="bg-black/50 rounded p-3 overflow-x-auto text-xs">
                <code className="text-green-400">{part.content}</code>
              </pre>
              {part.language && (
                <span className="text-xs text-muted-foreground mt-1 block">
                  {part.language}
                </span>
              )}
            </div>
          ) : (
            <p key={idx} className="text-sm whitespace-pre-wrap break-words">
              {part.content}
            </p>
          )
        )}
      </div>
    );
  };

  if (messages.length === 0 && !isLoading) {
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
                {renderContent(message.content)}
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
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div className="rounded-lg px-4 py-2 bg-muted">
                <div className="flex gap-1 items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
