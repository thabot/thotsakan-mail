import type { IEmailPlugin, EmailContext, DispatchResult } from '../types/plugin.types.js';

export class HookPipeline {
  private plugins: IEmailPlugin[] = [];

  public register(plugin: IEmailPlugin): void {
    this.plugins.push(plugin);
  }

  public getPlugins(): readonly IEmailPlugin[] {
    return this.plugins;
  }

  public async executeBeforeValidate(context: EmailContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onBeforeValidate) {
        await plugin.onBeforeValidate(context);
      }
    }
  }

  public async executeBeforeSend(context: EmailContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onBeforeSend) {
        await plugin.onBeforeSend(context);
      }
    }
  }

  public async executeAfterSend(context: EmailContext, result: DispatchResult): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onAfterSend) {
        await plugin.onAfterSend(context, result);
      }
    }
  }

  public async executeError(context: EmailContext, error: Error): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onError) {
        await plugin.onError(context, error);
      }
    }
  }
}
