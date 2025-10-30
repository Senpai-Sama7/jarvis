/**
 * Plugin Manager
 * Manages plugin lifecycle and registration
 */

import { Plugin, PluginContext, Command, Route } from '../../types';
import { logger } from '../utils/logger';
import { ConfigurationError } from '../utils/errors';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private context: PluginContext;
  private commands: Map<string, Command> = new Map();
  private routes: Map<string, Route> = new Map();

  constructor(context: PluginContext) {
    this.context = {
      ...context,
      registerCommand: this.registerCommand.bind(this),
      registerRoute: this.registerRoute.bind(this),
    };
  }

  /**
   * Register a command from a plugin
   */
  private registerCommand(command: Command): void {
    if (this.commands.has(command.name)) {
      logger.warn(`Command ${command.name} is already registered, overwriting`);
    }
    
    this.commands.set(command.name, command);
    logger.debug(`Registered command: ${command.name}`);
  }

  /**
   * Register an API route from a plugin
   */
  private registerRoute(route: Route): void {
    const key = `${route.method}:${route.path}`;
    
    if (this.routes.has(key)) {
      logger.warn(`Route ${key} is already registered, overwriting`);
    }
    
    this.routes.set(key, route);
    logger.debug(`Registered route: ${key}`);
  }

  /**
   * Load and initialize a plugin
   */
  async loadPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new ConfigurationError(`Plugin ${plugin.name} is already loaded`);
    }

    logger.info(`Loading plugin: ${plugin.name} v${plugin.version}`);

    try {
      await plugin.init(this.context);
      this.plugins.set(plugin.name, plugin);
      logger.info(`Plugin ${plugin.name} loaded successfully`);
    } catch (error) {
      logger.error(`Failed to load plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Unload and destroy a plugin
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin) {
      throw new ConfigurationError(`Plugin ${pluginName} is not loaded`);
    }

    logger.info(`Unloading plugin: ${pluginName}`);

    try {
      await plugin.destroy();
      this.plugins.delete(pluginName);
      
      // Remove plugin's commands and routes
      // (In a production system, you'd track which plugin registered what)
      logger.info(`Plugin ${pluginName} unloaded successfully`);
    } catch (error) {
      logger.error(`Failed to unload plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered commands
   */
  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get a specific command
   */
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * Unload all plugins
   */
  async unloadAll(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    
    for (const name of pluginNames) {
      await this.unloadPlugin(name);
    }
  }
}
