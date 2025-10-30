import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { SecurityError } from '../../types';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  files?: string[];
}

export interface ExecutionOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  allowFileWrite?: boolean;
  allowNetworkAccess?: boolean;
}

const SAFE_COMMANDS = [
  'ls', 'cat', 'echo', 'pwd', 'whoami', 'date',
  'node', 'npm', 'python', 'python3', 'git',
  'mkdir', 'touch', 'cp', 'mv', 'rm'
];

export class CodeExecutor {
  private workDir: string;
  private maxTimeout = 30000; // 30 seconds

  constructor(workDir?: string) {
    this.workDir = workDir || process.cwd();
  }

  async executeCommand(
    command: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    try {
      // Security check
      if (!this.isCommandSafe(command)) {
        throw new SecurityError('Command not allowed for security reasons');
      }

      const timeout = Math.min(options.timeout || 10000, this.maxTimeout);
      const cwd = options.cwd || this.workDir;

      logger.info(`Executing: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...process.env, ...options.env },
        maxBuffer: 1024 * 1024 // 1MB
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error: any) {
      logger.error('Execution error:', error);
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim(),
        exitCode: error.code
      };
    }
  }

  async executeCode(
    code: string,
    language: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const tempDir = path.join(this.workDir, '.jarvis-temp');
    await fs.mkdir(tempDir, { recursive: true });

    try {
      let filename: string;
      let command: string;

      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          filename = path.join(tempDir, `script-${Date.now()}.js`);
          await fs.writeFile(filename, code);
          command = `node ${filename}`;
          break;

        case 'typescript':
        case 'ts':
          filename = path.join(tempDir, `script-${Date.now()}.ts`);
          await fs.writeFile(filename, code);
          command = `npx ts-node ${filename}`;
          break;

        case 'python':
        case 'py':
          filename = path.join(tempDir, `script-${Date.now()}.py`);
          await fs.writeFile(filename, code);
          command = `python3 ${filename}`;
          break;

        case 'bash':
        case 'sh':
          filename = path.join(tempDir, `script-${Date.now()}.sh`);
          await fs.writeFile(filename, code);
          await fs.chmod(filename, 0o755);
          command = `bash ${filename}`;
          break;

        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const result = await this.executeCommand(command, options);
      
      // Cleanup
      try {
        await fs.unlink(filename);
      } catch {}

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createFile(filepath: string, content: string): Promise<ExecutionResult> {
    try {
      const fullPath = path.join(this.workDir, filepath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content);

      return {
        success: true,
        files: [fullPath]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async readFile(filepath: string): Promise<ExecutionResult> {
    try {
      const fullPath = path.join(this.workDir, filepath);
      const content = await fs.readFile(fullPath, 'utf-8');

      return {
        success: true,
        stdout: content
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(dirpath: string = '.'): Promise<ExecutionResult> {
    try {
      const fullPath = path.join(this.workDir, dirpath);
      const files = await fs.readdir(fullPath);

      return {
        success: true,
        stdout: files.join('\n'),
        files
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private isCommandSafe(command: string): boolean {
    const baseCommand = command.trim().split(' ')[0];
    
    // Check if command is in safe list
    if (SAFE_COMMANDS.includes(baseCommand)) {
      return true;
    }

    // Block dangerous commands
    const dangerous = ['rm -rf /', 'dd', 'mkfs', 'format', ':(){:|:&};:'];
    if (dangerous.some(d => command.includes(d))) {
      return false;
    }

    return true;
  }

  setWorkDir(dir: string) {
    this.workDir = dir;
  }

  getWorkDir(): string {
    return this.workDir;
  }
}

export const executor = new CodeExecutor();
