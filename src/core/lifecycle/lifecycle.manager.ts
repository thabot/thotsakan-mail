export class AppLifecycleManager {
  private static instance: AppLifecycleManager;
  private isShuttingDown = false;
  private activeJobsCount = 0;
  private cleanupHandlers: Array<() => Promise<void> | void> = [];

  private constructor() {
    this.registerSignalHandlers();
  }

  public static getInstance(): AppLifecycleManager {
    if (!AppLifecycleManager.instance) {
      AppLifecycleManager.instance = new AppLifecycleManager();
    }
    return AppLifecycleManager.instance;
  }

  public registerCleanupHandler(handler: () => Promise<void> | void): void {
    this.cleanupHandlers.push(handler);
  }

  public trackJobStart(): boolean {
    if (this.isShuttingDown) {
      return false;
    }
    this.activeJobsCount++;
    return true;
  }

  public trackJobEnd(): void {
    this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
  }

  public getActiveJobsCount(): number {
    return this.activeJobsCount;
  }

  public isTerminating(): boolean {
    return this.isShuttingDown;
  }

  public async shutdown(timeoutMs: number = 15000): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    console.log('\n🛑 Graceful Shutdown initiated... Stopping new incoming jobs.');

    const startTime = Date.now();
    while (this.activeJobsCount > 0 && Date.now() - startTime < timeoutMs) {
      console.log(`⏳ Waiting for ${this.activeJobsCount} in-flight jobs to finish...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (this.activeJobsCount > 0) {
      console.warn(`⚠️ Timeout reached! Forcing shutdown with ${this.activeJobsCount} active jobs remaining.`);
    } else {
      console.log('✅ All in-flight jobs cleared cleanly.');
    }

    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (err) {
        console.error('Error during cleanup handler execution:', err);
      }
    }

    console.log('👋 Thotsakan Engine shut down successfully.');
  }

  private registerSignalHandlers(): void {
    const handleSignal = async (signal: string) => {
      console.log(`Received signal ${signal}`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));
  }
}
