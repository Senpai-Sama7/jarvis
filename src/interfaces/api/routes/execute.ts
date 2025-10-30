import { Router, Request, Response } from 'express';
import { executor } from '../../../core/execution/executor';
import { sanitizePrompt } from '../../../core/security/sanitizer';
import { logger } from '../../../core/utils/logger';
import { createGroqClient } from '../../../core/ai/groq-client';
import { loadConfig } from '../../../core/config';

const router = Router();
const config = loadConfig();
const client = createGroqClient(process.env.GROQ_API_KEY || '', config.ai.model);

// Execute shell command
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { command, cwd, timeout } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await executor.executeCommand(command, { cwd, timeout });
    res.json(result);
  } catch (error: any) {
    logger.error('Command execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute code
router.post('/code', async (req: Request, res: Response) => {
  try {
    const { code, language, cwd } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const result = await executor.executeCode(code, language, { cwd });
    res.json(result);
  } catch (error: any) {
    logger.error('Code execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI-assisted execution
router.post('/ai-execute', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const sanitized = sanitizePrompt(prompt);

    // Ask AI to generate command/code
    const aiResponse = await client.chat({
      messages: [
        {
          role: 'system',
          content: `You are a code execution assistant. Generate executable commands or code based on user requests.
          
Rules:
1. For simple tasks, provide shell commands
2. For complex tasks, provide code (JavaScript, Python, etc.)
3. Always respond in JSON format: {"type": "command|code", "language": "bash|js|py", "content": "...", "explanation": "..."}
4. Be safe - no destructive operations without confirmation
5. Provide clear explanations`
        },
        { role: 'user', content: sanitized }
      ]
    });

    // Parse AI response
    let execution;
    try {
      const parsed = JSON.parse(aiResponse.content);
      
      if (parsed.type === 'command') {
        execution = await executor.executeCommand(parsed.content);
      } else if (parsed.type === 'code') {
        execution = await executor.executeCode(parsed.content, parsed.language);
      }

      res.json({
        ai: parsed,
        execution
      });
    } catch {
      // If AI didn't return JSON, just return the response
      res.json({
        ai: { explanation: aiResponse.content },
        execution: null
      });
    }
  } catch (error: any) {
    logger.error('AI execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// File operations
router.post('/file/create', async (req: Request, res: Response) => {
  try {
    const { filepath, content } = req.body;
    
    if (!filepath || !content) {
      return res.status(400).json({ error: 'Filepath and content are required' });
    }

    const result = await executor.createFile(filepath, content);
    res.json(result);
  } catch (error: any) {
    logger.error('File creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/file/read', async (req: Request, res: Response) => {
  try {
    const { filepath } = req.query;
    
    if (!filepath) {
      return res.status(400).json({ error: 'Filepath is required' });
    }

    const result = await executor.readFile(filepath as string);
    res.json(result);
  } catch (error: any) {
    logger.error('File read error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/file/list', async (req: Request, res: Response) => {
  try {
    const { dirpath } = req.query;
    const result = await executor.listFiles(dirpath as string);
    res.json(result);
  } catch (error: any) {
    logger.error('File list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get working directory
router.get('/workdir', async (req: Request, res: Response) => {
  res.json({ workdir: executor.getWorkDir() });
});

// Set working directory
router.post('/workdir', async (req: Request, res: Response) => {
  try {
    const { workdir } = req.body;
    
    if (!workdir) {
      return res.status(400).json({ error: 'Workdir is required' });
    }

    executor.setWorkDir(workdir);
    res.json({ success: true, workdir: executor.getWorkDir() });
  } catch (error: any) {
    logger.error('Workdir error:', error);
    res.status(500).json({ error: error.message });
  }
});

export const executeRouter = router;
