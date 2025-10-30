/**
 * Configuration Loader
 * Loads and manages application configuration
 */

import fs from 'fs';
import path from 'path';
import { JarvisConfig, ConfigurationError, ValidationResult } from '../../types';
import { safeJsonParse } from '../utils/helpers';
import { validateConfig } from './validator';

const DEFAULT_CONFIG: JarvisConfig = {
  ai: {
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    maxTokens: 8000,
    temperature: 0.7,
  },
  voice: {
    input: {
      enabled: true,
      model: 'whisper-large-v3',
      silenceDuration: 2,
      silenceThreshold: '5%',
    },
    output: {
      enabled: true,
      engine: 'festival',
    },
  },
  security: {
    authentication: {
      enabled: false,
      method: 'apikey',
    },
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000,
    },
    inputSanitization: {
      enabled: true,
    },
  },
  interfaces: {
    cli: { enabled: true },
    tui: { enabled: true },
    gui: { enabled: true },
    web: { enabled: true, port: 3000 },
    api: { enabled: true, port: 8080 },
  },
};

/**
 * Load configuration from file
 */
function loadConfigFromFile(configPath: string): Partial<JarvisConfig> {
  try {
    if (!fs.existsSync(configPath)) {
      return {};
    }
    
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new ConfigurationError(
      `Failed to load config from ${configPath}`,
      error
    );
  }
}

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): Partial<JarvisConfig> {
  const config: Partial<JarvisConfig> = {};
  
  // AI configuration
  if (process.env.AI_PROVIDER) {
    if (!config.ai) config.ai = {} as any;
    config.ai!.provider = process.env.AI_PROVIDER as any;
  }
  if (process.env.AI_MODEL) {
    if (!config.ai) config.ai = {} as any;
    config.ai!.model = process.env.AI_MODEL;
  }
  
  // Voice configuration
  if (process.env.VOICE_ENABLED !== undefined) {
    if (!config.voice) config.voice = {} as any;
    if (!config.voice!.input) config.voice!.input = {} as any;
    config.voice!.input!.enabled = process.env.VOICE_ENABLED === 'true';
  }
  
  // Interface ports
  if (process.env.WEB_PORT) {
    if (!config.interfaces) config.interfaces = {} as any;
    if (!config.interfaces!.web) config.interfaces!.web = {} as any;
    config.interfaces!.web!.port = parseInt(process.env.WEB_PORT, 10);
  }
  if (process.env.API_PORT) {
    if (!config.interfaces) config.interfaces = {} as any;
    if (!config.interfaces!.api) config.interfaces!.api = {} as any;
    config.interfaces!.api!.port = parseInt(process.env.API_PORT, 10);
  }
  
  return config;
}

/**
 * Merge configurations with priority: env > file > default
 */
function mergeConfigs(...configs: Partial<JarvisConfig>[]): JarvisConfig {
  const merged: any = { ...DEFAULT_CONFIG };
  
  for (const config of configs) {
    for (const key in config) {
      if (typeof config[key as keyof JarvisConfig] === 'object' && !Array.isArray(config[key as keyof JarvisConfig])) {
        merged[key] = { ...merged[key], ...config[key as keyof JarvisConfig] };
      } else {
        merged[key] = config[key as keyof JarvisConfig];
      }
    }
  }
  
  return merged;
}

/**
 * Load complete configuration
 */
export function loadConfig(configPath?: string): JarvisConfig {
  // Start with default config
  let config = { ...DEFAULT_CONFIG };
  
  // Try to load from default locations
  const configPaths = [
    configPath,
    path.join(process.cwd(), 'config', 'default.json'),
    path.join(process.cwd(), 'config', `${process.env.NODE_ENV || 'development'}.json`),
    path.join(process.cwd(), '.jarvisrc.json'),
  ].filter(Boolean) as string[];
  
  for (const path of configPaths) {
    const fileConfig = loadConfigFromFile(path);
    config = mergeConfigs(config, fileConfig);
  }
  
  // Override with environment variables
  const envConfig = loadConfigFromEnv();
  config = mergeConfigs(config, envConfig);
  
  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.isValid) {
    throw new ConfigurationError(
      'Invalid configuration',
      { errors: validation.errors }
    );
  }
  
  return config;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): JarvisConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to file
 */
export function saveConfig(config: JarvisConfig, filePath: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(
      filePath,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new ConfigurationError(
      `Failed to save config to ${filePath}`,
      error
    );
  }
}
