import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LeadInput {
  creatorName: string;
  channelName: string;
  email: string;
}

interface ProofLinks {
  dubbing?: string;
  design?: string;
  dev?: string;
}

interface RequestPayload {
  leads: LeadInput[];
  senderName?: string;
  customNote?: string;
  proofLinks?: ProofLinks;
}

// Utility to sleep with AbortSignal cancellation support
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Campaign aborted'));
    const timer = setTimeout(() => resolve(), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Campaign aborted'));
    });
  });
}

export async function POST(req: NextRequest) {
  let body: RequestPayload;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { leads, senderName = 'Alex', customNote = '', proofLinks = {} } = body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return new Response(JSON.stringify({ error: 'No creator leads provided in request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // SMTP credentials from environment
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const smtpSecure = smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    return new Response(
      JSON.stringify({
        error: 'SMTP credentials missing. Please define SMTP_USER and SMTP_PASS in .env.local.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Nodemailer SMTP transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  const encoder = new TextEncoder();

  // Create real-time Server-Sent Events stream
  const stream = new ReadableStream({
    async start(controller) {
      const emitEvent = (data: Record<string, any>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream client disconnected
        }
      };

      emitEvent({
        type: 'INIT',
        message: `[MISSION ENGINE] Campaign initialized. Enqueued ${leads.length} creator targets.`,
        total: leads.length,
        timestamp: new Date().toISOString(),
      });

      for (let i = 0; i < leads.length; i++) {
        if (req.signal.aborted) {
          emitEvent({
            type: 'ABORTED',
            message: '[ABORT] Dispatch sequence halted by client.',
            timestamp: new Date().toISOString(),
          });
          break;
        }

        const lead = leads[i];
        const { creatorName, channelName, email } = lead;

        emitEvent({
          type: 'DISPATCHING',
          channel: channelName,
          email,
          index: i + 1,
          total: leads.length,
          message: `[DISPATCHING] Crafting personalized pitch and handshaking SMTP for ${channelName} (${email})...`,
          timestamp: new Date().toISOString(),
        });

        // 1. Dynamic Subject Line
        const subject = `Quick question regarding ${channelName} & Bengali audience expansion`;

        // 2. High-Converting Personalized HTML Pitch Body
        const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; }
    .wrapper { width: 100%; background-color: #0b0f17; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f293d; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 24px 28px; border-bottom: 1px solid #1f293d; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #00f0ff; background: rgba(0, 240, 255, 0.12); border: 1px solid rgba(0, 240, 255, 0.3); padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px; }
    .title { margin: 0; font-size: 19px; font-weight: 700; color: #ffffff; }
    .content { padding: 28px; color: #cbd5e1; font-size: 14.5px; }
    .hook { font-size: 15px; margin-bottom: 18px; }
    .feature-card { background-color: #162032; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 18px 0; }
    .feature-title { color: #ffffff; font-weight: 700; font-size: 15px; }
    .metric { color: #34d399; font-weight: 700; }
    .list { margin: 14px 0; padding-left: 20px; }
    .list li { margin-bottom: 8px; }
    .proof-box { background-color: #0d1524; border: 1px solid #1e293b; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
    .proof-links a { color: #38bdf8; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 14px; margin-top: 6px; }
    .proof-links a:hover { text-decoration: underline; }
    .cta-card { background: linear-gradient(180deg, #131d2e 0%, #0d1522 100%); border: 1px dashed #00f0ff; border-radius: 8px; padding: 18px; margin: 22px 0; text-align: center; }
    .cta-heading { color: #00f0ff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13.5px; padding: 11px 22px; border-radius: 6px; margin-top: 12px; }
    .footer { background-color: #0b0f17; padding: 18px 28px; border-top: 1px solid #1a2233; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="badge">Audience Localization Initiative</div>
        <h1 class="title">Unlocking South Asia's 250M+ Viewers for ${channelName}</h1>
      </div>
      <div class="content">
        <p class="hook">Hey <strong>${creatorName}</strong>,</p>
        <p>I’ve been closely tracking your uploads on <strong>${channelName}</strong>—the editorial pacing, storytelling, and high-energy engagement consistently set the benchmark in your space.</p>

        ${customNote ? `<p style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 10px 14px; border-radius: 0 6px 6px 0; color: #e2e8f0; font-size: 14px;">${customNote}</p>` : ''}

        <p>I'm reaching out with a direct, high-leverage growth proposal:</p>

        <div class="feature-card">
          <div class="feature-title">Core Initiative: AI English-to-Bengali Video Dubbing</div>
          <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #94a3b8;">
            Tap into the <span class="metric">250M+ native Bengali demographic</span> (Bangladesh &amp; West Bengal) with zero friction on your end. Bengali viewers represent one of the fastest-growing watch-time cohorts on YouTube, yet international tier-1 creators rarely localize for them.
          </p>
        </div>

        <p>Beyond neural voice cloning that mirrors your exact vocal timbre and energy, our studio also provides:</p>
        <ul class="list">
          <li><strong>High-CTR Custom Thumbnails:</strong> Engineered specifically for tech &amp; gaming niches (A/B tested for 12%+ CTR).</li>
          <li><strong>Full-Stack Automation &amp; Web Dev:</strong> Custom Discord community bots, interactive esports hubs, and automation tooling for creator workflows.</li>
        </ul>

        <div class="proof-box">
          <strong style="color: #cbd5e1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Verified Work Proofs &amp; Demos:</strong>
          <div class="proof-links">
            ${proofLinks.dubbing ? `<a href="${proofLinks.dubbing}" target="_blank">🎙️ Bengali Dub Sample</a>` : ''}
            ${proofLinks.design ? `<a href="${proofLinks.design}" target="_blank">🎨 Thumbnail &amp; Design Portfolio</a>` : ''}
            ${proofLinks.dev ? `<a href="${proofLinks.dev}" target="_blank">⚡ Dev &amp; Automation Projects</a>` : ''}
          </div>
        </div>

        <div class="cta-card">
          <div class="cta-heading">Zero-Risk Free Test Offer</div>
          <p style="margin: 6px 0 10px 0; font-size: 13px; color: #cbd5e1;">
            I can dub a free 60-second test clip from your latest video so you can judge the voice cloning fidelity and emotional accuracy yourself.
          </p>
          <a href="mailto:${smtpUser}?subject=Send%2060s%20Dub%20Test%20for%20${encodeURIComponent(channelName)}" class="cta-button">Claim Free 60s Sample</a>
        </div>

        <p style="margin-top: 20px; font-size: 14px;">
          Would you be open to letting me dub a 60-second clip from your latest upload?
        </p>

        <p style="margin-bottom: 0;">
          Best regards,<br>
          <strong>${senderName}</strong><br>
          <span style="font-size: 12.5px; color: #64748b;">Creator Localization &amp; AI Dev Specialist</span>
        </p>
      </div>

      <div class="footer">
        Delivered via Creator Outreach Engine // Direct creator inquiry. Reply with "unsub" if you prefer not to receive updates.
      </div>
    </div>
  </div>
</body>
</html>`;

        // 3. Plain Text Alternative
        const textBody = `Hey ${creatorName},

I’ve been following ${channelName} and really admire the production quality you bring to every video.

Quick proposition:
I help international creators unlock the 250M+ Bengali demographic (Bangladesh & West Bengal) with zero friction on your end through neural English-to-Bengali video dubbing that preserves your voice, intonation, and excitement.

We also build:
- High-CTR Gaming/Tech Thumbnails (A/B tested for 12%+ CTR)
- Custom Discord Automation Bots & Web Platforms

Proofs:
${proofLinks.dubbing ? `- Dubbing Sample: ${proofLinks.dubbing}` : ''}
${proofLinks.design ? `- Design Portfolio: ${proofLinks.design}` : ''}
${proofLinks.dev ? `- Dev Projects: ${proofLinks.dev}` : ''}

Offer:
I can dub a free 60-second test clip from your latest ${channelName} video so you can judge the quality yourself with zero commitment.

Would you be open to seeing a 60s test clip?

Best regards,
${senderName}
${smtpUser}`;

        // 4. Send Email via Transporter
        const startTime = performance.now();
        try {
          const info = await transporter.sendMail({
            from: `"${senderName}" <${smtpUser}>`,
            to: email.trim(),
            replyTo: smtpUser,
            subject,
            text: textBody,
            html: htmlBody,
          });

          const latency = Math.round(performance.now() - startTime);

          emitEvent({
            status: 'SENT',
            channel: channelName,
            email,
            latency,
            index: i + 1,
            total: leads.length,
            messageId: info.messageId,
            message: `[DISPATCHED] Successfully sent pitch to ${email} (Delivered in ${latency}ms)`,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          const latency = Math.round(performance.now() - startTime);
          emitEvent({
            status: 'FAILED',
            channel: channelName,
            email,
            latency,
            index: i + 1,
            total: leads.length,
            error: err?.message || 'SMTP dispatch failed',
            message: `[FAILED] Error dispatching to ${email}: ${err?.message || 'Failed to authenticate or deliver'}`,
            timestamp: new Date().toISOString(),
          });
        }

        // 5. Enforce Anti-Spam Delay (20 to 30s) between dispatches (skip on final email)
        if (i < leads.length - 1) {
          const delaySeconds = 25; // Safe anti-spam interval
          for (let sec = delaySeconds; sec > 0; sec--) {
            if (req.signal.aborted) break;

            emitEvent({
              type: 'COUNTDOWN',
              remainingSeconds: sec,
              message: `[ANTI-SPAM COOLDOWN] Safe delay active: ${sec}s until next dispatch to protect Gmail reputation...`,
              timestamp: new Date().toISOString(),
            });

            await sleep(1000, req.signal).catch(() => {});
          }
        }
      }

      emitEvent({
        type: 'COMPLETED',
        message: '[COMPLETED] Outreach campaign execution finished.',
        timestamp: new Date().toISOString(),
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
