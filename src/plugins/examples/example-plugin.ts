/**
 * Example Plugin
 * Demonstrates how to create a JARVIS plugin
 */

import { Plugin, PluginContext } from '../../types';

export const examplePlugin: Plugin = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'An example plugin demonstrating the plugin system',

  async init(context: PluginContext): Promise<void> {
    context.logger.info('Example plugin initializing...');

    // Register a custom command
    if (context.registerCommand) {
      context.registerCommand({
        name: 'example',
        description: 'Run example plugin command',
        args: ['message'],
        handler: async (args) => {
          const message = args.message || 'Hello from example plugin!';
          context.logger.info(`Example command executed: ${message}`);
          
          // Use AI to respond
          const response = await context.ai.chat({
            messages: [
              {
                role: 'user',
                content: `Respond to this message: ${message}`,
              },
            ],
          });
          
          console.log(`🤖 AI Response: ${response.content}`);
        },
      });
    }

    // Register a custom API route
    if (context.registerRoute) {
      context.registerRoute({
        method: 'GET',
        path: '/api/plugin/example',
        handler: async (req, res) => {
          res.json({
            plugin: 'example-plugin',
            message: 'Hello from example plugin API!',
          });
        },
      });
    }

    context.logger.info('Example plugin initialized successfully');
  },

  async destroy(): Promise<void> {
    // Cleanup resources if needed
    console.log('Example plugin destroyed');
  },
};
