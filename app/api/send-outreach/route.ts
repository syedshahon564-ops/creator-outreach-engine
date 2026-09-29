import { NextRequest } from 'next/server';
import { CreatorLead, OutreachConfig, StreamEventPayload } from '@/types/outreach';
import { generatePitch } from '@/lib/pitchEngine';
import { dispatchOutreachEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Nodemailer

// Helper to pause execution with cancellation check
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Operation aborted by user'));
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Operation aborted by user'));
      });
    }
  });
}

export async function POST(req: NextRequest) {
  let body: { leads?: CreatorLead[]; config?: OutreachConfig };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { leads, config } = body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return new Response(JSON.stringify({ error: 'No creator leads provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Merge runtime config with environment variables if not provided
  const finalConfig: OutreachConfig = {
    senderName: config?.senderName || process.env.SENDER_NAME || 'Localization & AI Dev Suite',
    senderEmail: config?.senderEmail || process.env.SMTP_USER || '',
    smtpHost: config?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(config?.smtpPort || process.env.SMTP_PORT || 465),
    smtpSecure: config?.smtpSecure !== undefined ? config.smtpSecure : true,
    smtpUser: config?.smtpUser || process.env.SMTP_USER || '',
    smtpPass: config?.smtpPass || process.env.SMTP_PASS || '',
    portfolioUrl: config?.portfolioUrl || process.env.PORTFOLIO_URL || 'https://drive.google.com/drive/folders/sample-dubbing-showcase',
    reviewUrl: config?.reviewUrl || process.env.REVIEW_URL || 'https://bengali-dub-hub.vercel.app/reviews',
    delaySeconds: Number(config?.delaySeconds !== undefined ? config.delaySeconds : 25),
  };

  if (!finalConfig.smtpUser || !finalConfig.smtpPass) {
    return new Response(
      JSON.stringify({
        error: 'SMTP credentials missing. Please supply sender email & Gmail App Password.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEventPayload) => {
        try {
          const payloadString = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payloadString));
        } catch (e) {
          // Stream might be closed if client disconnected
        }
      };

      const now = () => new Date().toISOString();

      sendEvent({
        type: 'start',
        message: `[MISSION ENGINE] Campaign initialized. Processing ${leads.length} creator leads with ${finalConfig.delaySeconds}s anti-spam throttle.`,
        timestamp: now(),
      });

      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < leads.length; i++) {
        if (req.signal.aborted) {
          sendEvent({
            type: 'error',
            message: `[ABORTED] Campaign dispatch aborted by client.`,
            timestamp: now(),
          });
          break;
        }

        const lead = leads[i];

        // Notify client that dispatch for this lead has begun
        sendEvent({
          type: 'sending',
          leadId: lead.id,
          channelName: lead.channelName,
          email: lead.email,
          message: `[SENDING] Crafting personalized AI pitch and connecting to SMTP for ${lead.channelName} (${lead.email})...`,
          timestamp: now(),
        });

        // Generate tailored dynamic pitch
        const pitch = generatePitch({
          creatorName: lead.creatorName,
          channelName: lead.channelName,
          niche: lead.niche,
          senderName: finalConfig.senderName,
          senderEmail: finalConfig.senderEmail,
          portfolioUrl: finalConfig.portfolioUrl,
          reviewUrl: finalConfig.reviewUrl,
        });

        // Dispatch email through real Nodemailer transporter
        const result = await dispatchOutreachEmail({
          config: finalConfig,
          to: lead.email,
          subject: pitch.subject,
          html: pitch.html,
          text: pitch.text,
        });

        if (result.success) {
          totalSent++;
          sendEvent({
            type: 'delivered',
            leadId: lead.id,
            channelName: lead.channelName,
            email: lead.email,
            durationMs: result.durationMs,
            messageId: result.messageId,
            totalSent,
            totalFailed,
            message: `[DISPATCHED] Successfully sent pitch to ${lead.email} (Delivered in ${result.durationMs}ms)`,
            timestamp: now(),
          });
        } else {
          totalFailed++;
          sendEvent({
            type: 'failed',
            leadId: lead.id,
            channelName: lead.channelName,
            email: lead.email,
            durationMs: result.durationMs,
            errorMessage: result.error,
            totalSent,
            totalFailed,
            message: `[FAILED] Error dispatching to ${lead.email}: ${result.error}`,
            timestamp: now(),
          });
        }

        // Apply anti-spam delay between emails if not the last item
        if (i < leads.length - 1 && finalConfig.delaySeconds > 0) {
          const delay = finalConfig.delaySeconds;
          for (let sec = delay; sec > 0; sec--) {
            if (req.signal.aborted) break;

            sendEvent({
              type: 'countdown',
              remainingSeconds: sec,
              message: `[ANTI-SPAM THROTTLE] Cool-down active: ${sec}s until dispatching next lead to protect Gmail sender reputation...`,
              timestamp: now(),
            });

            await sleep(1000, req.signal).catch(() => {});
          }
        }
      }

      // Campaign finished
      sendEvent({
        type: 'completed',
        totalSent,
        totalFailed,
        message: `[COMPLETED] Batch outreach cycle finished. Total sent: ${totalSent}, Total failed: ${totalFailed}.`,
        timestamp: now(),
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering on Nginx/Vercel
    },
  });
}
