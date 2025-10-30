/**
 * Core Type Definitions for JARVIS
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface JarvisConfig {
  ai: AIConfig;
  voice: VoiceConfig;
  security: SecurityConfig;
  interfaces: InterfacesConfig;
}

export interface AIConfig {
  provider: 'groq' | 'anthropic' | 'openai';
  model: string;
  apiKey?: string; // Should come from environment
  maxTokens?: number;
  temperature?: number;
}

export interface VoiceConfig {
  input: {
    enabled: boolean;
    model: string;
    silenceDuration: number;
    silenceThreshold: string;
  };
  output: {
    enabled: boolean;
    engine: 'festival' | 'espeak' | 'say';
    voice?: string;
  };
}

export interface SecurityConfig {
  authentication: {
    enabled: boolean;
    method: 'jwt' | 'apikey' | 'oauth';
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  inputSanitization: {
    enabled: boolean;
  };
}

export interface InterfacesConfig {
  cli: { enabled: boolean };
  tui: { enabled: boolean };
  gui: { enabled: boolean };
  web: { enabled: boolean; port: number };
  api: { enabled: boolean; port: number };
}

// ============================================================================
// AI/LLM Types
// ============================================================================

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClient {
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  streamChat(request: ChatCompletionRequest): AsyncGenerator<string>;
}

// ============================================================================
// Voice Types
// ============================================================================

export interface AudioRecordingOptions {
  silenceDetection?: boolean;
  maxDuration?: number;
  format?: 'wav' | 'mp3';
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface SynthesisOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
}

// ============================================================================
// Code Tools Types
// ============================================================================

export interface CodeAnalysisResult {
  language: string;
  complexity: number;
  issues: CodeIssue[];
  suggestions: string[];
}

export interface CodeIssue {
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  message: string;
  code?: string;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface CodeExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export interface CodeSearchOptions {
  pattern: string;
  fileTypes?: string[];
  caseSensitive?: boolean;
  maxResults?: number;
}

export interface CodeSearchResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context?: string;
}

// ============================================================================
// Plugin Types
// ============================================================================

export interface Plugin {
  name: string;
  version: string;
  description: string;
  init(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
}

export interface PluginContext {
  config: JarvisConfig;
  logger: Logger;
  ai: LLMClient;
  registerCommand?(command: Command): void;
  registerRoute?(route: Route): void;
}

export interface Command {
  name: string;
  description: string;
  args?: string[];
  handler: (args: any) => Promise<void>;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (req: any, res: any) => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  messages: Message[];
  metadata: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

export class JarvisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'JarvisError';
  }
}

export class ConfigurationError extends JarvisError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class SecurityError extends JarvisError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

export class AIError extends JarvisError {
  constructor(message: string, details?: any) {
    super(message, 'AI_ERROR', details);
    this.name = 'AIError';
  }
}
