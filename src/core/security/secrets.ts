import { SecurityError } from '../../types';

export function validateSecrets(): boolean {
  const required = ['GROQ_API_KEY'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new SecurityError(
      `Missing required environment variables: ${missing.join(', ')}`,
      { missing }
    );
  }

  return true;
}

export function getSecret(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new SecurityError(`Secret ${key} not found`);
  }
  return value;
}
