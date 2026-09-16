import type { EmailContext, DispatchResult } from '../types/plugin.types.js';

export interface IStorageDriver {
  init(): Promise<void>;
  close(): Promise<void>;
  saveLog(context: EmailContext): Promise<void>;
  updateLogStatus(jobId: string, status: string, result?: DispatchResult): Promise<void>;
}

export interface IQueueDriver {
  enqueue(context: EmailContext): Promise<string>;
  dequeue(): Promise<EmailContext | null>;
  ack(jobId: string): Promise<void>;
  nack(jobId: string, retryAfterSeconds?: number, error?: string): Promise<void>;
}
