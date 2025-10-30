import { LLMClient, ChatCompletionRequest, ChatCompletionResponse } from '../../types';

export type { ChatCompletionRequest, ChatCompletionResponse };

export abstract class BaseLLMClient implements LLMClient {
  protected model: string;
  protected apiKey: string;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.apiKey = apiKey;
  }

  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract streamChat(request: ChatCompletionRequest): AsyncGenerator<string>;
}
