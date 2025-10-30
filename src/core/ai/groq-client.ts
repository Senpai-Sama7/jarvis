/**
 * Groq API Client
 * Implements LLM interface for Groq models
 */

import Groq from 'groq-sdk';
import { BaseLLMClient, ChatCompletionRequest, ChatCompletionResponse } from './llm-interface';
import { AIError } from '../../types';
import { logger } from '../utils/logger';

export class GroqClient extends BaseLLMClient {
  private client: Groq;

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    super(model, apiKey);
    this.client = new Groq({ apiKey });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: request.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        model: request.model || this.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false,
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new AIError('No response from Groq API');
      }

      return {
        content: choice.message.content || '',
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error('Groq chat error:', error);
      throw new AIError('Failed to get chat completion from Groq', error);
    }
  }

  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        messages: request.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        model: request.model || this.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('Groq stream error:', error);
      throw new AIError('Failed to stream chat completion from Groq', error);
    }
  }

  /**
   * Transcribe audio using Whisper model
   */
  async transcribe(audioFilePath: string, model: string = 'whisper-large-v3'): Promise<string> {
    try {
      const fs = await import('fs');
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model,
        response_format: 'text',
      });

      return String(transcription);
    } catch (error) {
      logger.error('Groq transcription error:', error);
      throw new AIError('Failed to transcribe audio with Groq', error);
    }
  }
}

/**
 * Create a Groq client with the given API key
 */
export function createGroqClient(apiKey: string, model?: string): GroqClient {
  return new GroqClient(apiKey, model);
}
