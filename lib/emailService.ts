import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { OutreachConfig } from '@/types/outreach';

/**
 * Creates and returns a Nodemailer transporter based on config or process.env fallbacks
 */
export function createSmtpTransporter(config?: Partial<OutreachConfig>): Transporter {
  const host = config?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(config?.smtpPort || process.env.SMTP_PORT || 465);
  const secure = config?.smtpSecure !== undefined ? config.smtpSecure : (port === 465);
  const user = config?.smtpUser || process.env.SMTP_USER || '';
  const pass = config?.smtpPass || process.env.SMTP_PASS || '';

  if (!user || !pass) {
    throw new Error('SMTP credentials missing. Please configure Sender Email and Gmail App Password.');
  }

  // Create real Nodemailer transport
  return nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports (587)
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''), // strip spaces often copied with 16-char Gmail app passwords
    },
    // Production timeouts
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

/**
 * Live test of SMTP connection and credentials
 */
export async function testSmtpConnection(config?: Partial<OutreachConfig>): Promise<{
  success: boolean;
  latencyMs: number;
  error?: string;
}> {
  const startTime = performance.now();
  try {
    const transporter = createSmtpTransporter(config);
    await transporter.verify();
    const latencyMs = Math.round(performance.now() - startTime);
    return { success: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      error: err?.message || 'SMTP connection verification failed.',
    };
  }
}

/**
 * Dispatches a real single email with Nodemailer
 */
export async function dispatchOutreachEmail(params: {
  config: OutreachConfig;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  durationMs: number;
  error?: string;
}> {
  const { config, to, subject, html, text } = params;
  const startTime = performance.now();

  try {
    const transporter = createSmtpTransporter(config);
    const senderName = config.senderName?.trim() || 'Creator Growth Specialist';
    const senderEmail = config.senderEmail?.trim() || config.smtpUser?.trim();

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: to.trim(),
      replyTo: senderEmail,
      subject,
      text,
      html,
      headers: {
        'X-Mailer': 'CreatorOutreachEngine/1.0',
        'X-Priority': '3', // Normal priority
      },
    });

    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      messageId: info.messageId,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      durationMs,
      error: err?.message || 'Failed to dispatch email via SMTP.',
    };
  }
}
