# JARVIS API Guide

## Overview

The JARVIS HTTP API provides programmatic access to all AI coding assistant features. It's built with Express and includes rate limiting, authentication, and input sanitization.

## Base URL

```
http://localhost:8080
```

## Authentication

Authentication is optional but recommended for production deployments.

### API Key Authentication

Set the `API_KEY` environment variable and include it in requests:

```bash
curl -H "Authorization: Bearer your-api-key" http://localhost:8080/api/chat
```

## Rate Limiting

Default rate limiting:
- 100 requests per minute per IP
- Configurable via `config/default.json`

## Endpoints

### Health Check

Check API status.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "2.0.0"
}
```

### Chat API

#### Send Chat Message

Send a message and get an AI response.

**Request:**
```http
POST /api/chat
Content-Type: application/json

{
  "message": "How do I implement JWT authentication?",
  "conversationId": "optional-conversation-id",
  "stream": false
}
```

**Response:**
```json
{
  "conversationId": "conv_1234567890",
  "message": "Here's how to implement JWT authentication...",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 200,
    "totalTokens": 250
  }
}
```

#### Get Conversation History

Retrieve conversation history.

**Request:**
```http
GET /api/chat/:conversationId
```

**Response:**
```json
{
  "conversationId": "conv_1234567890",
  "messages": [
    {
      "role": "user",
      "content": "How do I implement JWT?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Here's how...",
      "timestamp": "2024-01-01T00:00:01.000Z"
    }
  ]
}
```

#### Clear Conversation

Delete conversation history.

**Request:**
```http
DELETE /api/chat/:conversationId
```

**Response:**
```json
{
  "message": "Conversation cleared"
}
```

### Code API

#### Generate Code

Generate code from a description.

**Request:**
```http
POST /api/code/generate
Content-Type: application/json

{
  "description": "function to sort array of objects by date",
  "language": "typescript"
}
```

**Response:**
```json
{
  "code": "function sortByDate(arr: any[]): any[] {\n  return arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());\n}",
  "language": "typescript",
  "usage": {
    "promptTokens": 30,
    "completionTokens": 100,
    "totalTokens": 130
  }
}
```

#### Explain Code

Get an explanation of code.

**Request:**
```http
POST /api/code/explain
Content-Type: application/json

{
  "code": "const result = arr.map(x => x * 2);",
  "language": "javascript"
}
```

**Response:**
```json
{
  "explanation": "This code uses the map() method to create a new array where each element is doubled...",
  "usage": {
    "promptTokens": 25,
    "completionTokens": 80,
    "totalTokens": 105
  }
}
```

#### Refactor Code

Get refactoring suggestions.

**Request:**
```http
POST /api/code/refactor
Content-Type: application/json

{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "suggestion": "add type safety"
}
```

**Response:**
```json
{
  "refactoredCode": "function add(a: number, b: number): number { return a + b; }",
  "usage": {
    "promptTokens": 35,
    "completionTokens": 90,
    "totalTokens": 125
  }
}
```

#### Review Code

Get a code review.

**Request:**
```http
POST /api/code/review
Content-Type: application/json

{
  "code": "function processData(data) {\n  // code here\n}",
  "language": "javascript"
}
```

**Response:**
```json
{
  "review": "Code Review:\n1. Add type annotations\n2. Add error handling\n3. Consider edge cases...",
  "usage": {
    "promptTokens": 40,
    "completionTokens": 150,
    "totalTokens": 190
  }
}
```

### Config API

#### Get Configuration

Get current configuration (excluding sensitive data).

**Request:**
```http
GET /api/config
```

**Response:**
```json
{
  "ai": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "maxTokens": 8000,
    "temperature": 0.7
  },
  "voice": {
    "input": {
      "enabled": true,
      "model": "whisper-large-v3"
    },
    "output": {
      "enabled": true,
      "engine": "festival"
    }
  },
  "interfaces": {
    "cli": { "enabled": true },
    "web": { "enabled": true, "port": 3000 },
    "api": { "enabled": true, "port": 8080 }
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function chatWithJarvis() {
  const response = await axios.post('http://localhost:8080/api/chat', {
    message: 'Explain async/await in JavaScript',
  });
  
  console.log(response.data.message);
}

chatWithJarvis();
```

### Python

```python
import requests

def chat_with_jarvis(message):
    response = requests.post(
        'http://localhost:8080/api/chat',
        json={'message': message}
    )
    return response.json()

result = chat_with_jarvis('How do I use decorators in Python?')
print(result['message'])
```

### cURL

```bash
# Generate code
curl -X POST http://localhost:8080/api/code/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "binary search algorithm", "language": "python"}'

# Chat
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are design patterns?"}'
```

## Streaming Responses

For long responses, use streaming:

```javascript
const response = await fetch('http://localhost:8080/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain microservices',
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.chunk) {
        process.stdout.write(data.chunk);
      }
    }
  }
}
```

## Best Practices

1. **Reuse Conversation IDs** - Maintain context across multiple messages
2. **Handle Rate Limits** - Implement exponential backoff for retries
3. **Validate Input** - Always validate data before sending
4. **Monitor Usage** - Track token usage to optimize costs
5. **Error Handling** - Implement proper error handling for all requests

## Security

- Never expose API keys in client-side code
- Use environment variables for sensitive data
- Enable authentication in production
- Use HTTPS in production
- Implement request validation
- Monitor for unusual activity

## Support

For issues and questions:
- GitHub Issues: https://github.com/Senpai-Sama7/jarvis/issues
- Documentation: See `docs/` directory
