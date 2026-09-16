import type { ProviderType, ProviderCredentials } from './provider.types.js';

export interface EmailAccount {
  id: string;
  tenantId: string;
  name: string;
  providerType: ProviderType;
  credentials: ProviderCredentials; // Stored encrypted in DB
  fromEmail: string;
  fromName?: string;
  dailyQuotaLimit: number;
  dailyQuotaUsed: number;
  rateLimitPerMinute: number;
  fallbackAccountId?: string;
  isActive: boolean;
  tokenCache?: string; // Stored encrypted
  tokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantApiKey {
  id: string;
  tenantId: string;
  keyHash: string;
  name: string;
  rateLimitPerMinute: number;
  isActive: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  subjectTemplate: string;
  htmlContent: string;
  mjmlContent?: string;
  textContent?: string;
  createdAt: string;
  updatedAt: string;
}
