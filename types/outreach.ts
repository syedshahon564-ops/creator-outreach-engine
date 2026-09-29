export type LeadStatus = 'pending' | 'sending' | 'delivered' | 'failed';

export interface CreatorLead {
  id: string;
  creatorName: string;
  channelName: string;
  email: string;
  niche: string;
  status: LeadStatus;
  sentAt?: string;
  durationMs?: number;
  errorMessage?: string;
  messageId?: string;
}

export interface OutreachConfig {
  senderName: string;
  senderEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  portfolioUrl: string;
  reviewUrl: string;
  delaySeconds: number; // Anti-spam delay between dispatches (seconds)
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface DispatchLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  channelName?: string;
  email?: string;
}

export interface PitchParams {
  creatorName: string;
  channelName: string;
  niche: string;
  senderName: string;
  senderEmail: string;
  portfolioUrl: string;
  reviewUrl: string;
}

export interface PitchOutput {
  subject: string;
  html: string;
  text: string;
}

export interface StreamEventPayload {
  type: 'start' | 'sending' | 'delivered' | 'failed' | 'countdown' | 'completed' | 'error';
  leadId?: string;
  channelName?: string;
  email?: string;
  durationMs?: number;
  messageId?: string;
  errorMessage?: string;
  remainingSeconds?: number;
  totalSent?: number;
  totalFailed?: number;
  message: string;
  timestamp: string;
}
