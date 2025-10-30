#!/usr/bin/env node
/**
 * JARVIS CLI Interface
 * Command-line interface for the AI coding assistant
 */

import { Command } from 'commander';
import { loadConfig } from '../../core/config';
import { validateSecrets } from '../../core/security/secrets';
import { createGroqClient } from '../../core/ai/groq-client';
import { logger } from '../../core/utils/logger';
import { handleError } from '../../core/utils/errors';
import { startInteractiveMode } from './repl';
import * as commands from './commands';

const program = new Command();

program
  .name('jarvis')
  .description('JARVIS - AI Coding Assistant')
  .version('2.0.0');

// Code generation command
program
  .command('generate')
  .description('Generate code from a description')
  .argument('<description>', 'Description of what to generate')
  .option('-l, --language <lang>', 'Programming language', 'typescript')
  .option('-o, --output <file>', 'Output file')
  .action(async (description, options) => {
    try {
      await commands.generateCode(description, options);
    } catch (error) {
      handleError(error, logger);
    }
  });

// Code explanation command
program
  .command('explain')
  .description('Explain a code file or snippet')
  .argument('<file>', 'File to explain')
  .action(async (file) => {
    try {
      await commands.explainCode(file);
    } catch (error) {
      handleError(error, logger);
    }
  });

// Code refactoring command
program
  .command('refactor')
  .description('Refactor code with suggestions')
  .argument('<file>', 'File to refactor')
  .option('-s, --suggestion <text>', 'Specific refactoring suggestion')
  .action(async (file, options) => {
    try {
      await commands.refactorCode(file, options);
    } catch (error) {
      handleError(error, logger);
    }
  });

// Code review command
program
  .command('review')
  .description('Review code and provide feedback')
  .argument('<file>', 'File to review')
  .action(async (file) => {
    try {
      await commands.reviewCode(file);
    } catch (error) {
      handleError(error, logger);
    }
  });

// Interactive chat command
program
  .command('chat')
  .description('Start interactive chat mode')
  .option('-v, --voice', 'Enable voice input/output')
  .action(async (options) => {
    try {
      await startInteractiveMode(options);
    } catch (error) {
      handleError(error, logger);
    }
  });

// Config command
program
  .command('config')
  .description('Show configuration')
  .action(() => {
    try {
      const config = loadConfig();
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      handleError(error, logger);
    }
  });

// Default action - show help or start interactive mode
if (process.argv.length === 2) {
  // No arguments - start interactive mode
  startInteractiveMode({ voice: false }).catch(error => {
    handleError(error, logger);
  });
} else {
  program.parse();
}
