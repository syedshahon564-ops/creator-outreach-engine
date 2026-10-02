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
  smtpUser?: string;
  smtpPass?: string;
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

// Helper to auto-linkify and convert newlines to HTML for custom notes
function formatCustomNoteToHtml(note: string): string {
  if (!note) return '';
  const escaped = note
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Linkify URLs
  const linkified = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">$1</a>'
  );

  return linkified.replace(/\n/g, '<br />');
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

  const {
    leads,
    senderName = 'Syed Shawon // Creative Director & Full-Stack Engineer',
    customNote = '',
    proofLinks = {
      design: 'https://syedshahon564-ops.github.io/',
      dev: 'https://syedshahon564-ops.github.io/danger-shawon/',
      dubbing: 'https://drive.google.com/drive/folders/sample-dubbing-showcase',
    },
  } = body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return new Response(JSON.stringify({ error: 'No creator leads provided in request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // SMTP credentials from body override or environment variables
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = (body.smtpUser || process.env.SMTP_USER || '').trim();
  const smtpPass = (body.smtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const smtpSecure = smtpPort === 465;

  if (!smtpUser || !smtpPass) {
    return new Response(
      JSON.stringify({
        error: 'SMTP credentials missing. Please enter your Gmail and 16-character App Password.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
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
        message: `[MISSION ENGINE] Campaign initialized. Processing ${leads.length} creator target(s).`,
        total: leads.length,
        timestamp: new Date().toISOString(),
      });

      for (let i = 0; i < leads.length; i++) {
        if (req.signal.aborted) {
          emitEvent({
            type: 'ABORTED',
            message: '[ABORT] Dispatch sequence halted by operator.',
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
        const subject = `Quick question regarding ${channelName} & growth strategy`;

        const designLink = proofLinks.design || 'https://syedshahon564-ops.github.io/';
        const devLink = proofLinks.dev || 'https://syedshahon564-ops.github.io/danger-shawon/';
        const dubbingLink = proofLinks.dubbing || 'https://drive.google.com/drive/folders/sample-dubbing-showcase';

        const formattedCustomNote = formatCustomNoteToHtml(customNote);

        // 2. High-Converting Personalized HTML Pitch Body
        const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; }
    .wrapper { width: 100%; background-color: #0b0f17; padding: 32px 16px; }
    .container { max-width: 620px; margin: 0 auto; background-color: #111827; border: 1px solid #1f293d; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 26px 30px; border-bottom: 1px solid #1f293d; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #00f0ff; background: rgba(0, 240, 255, 0.12); border: 1px solid rgba(0, 240, 255, 0.3); padding: 4px 12px; border-radius: 9999px; margin-bottom: 10px; }
    .title { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; }
    .content { padding: 30px; color: #cbd5e1; font-size: 14.5px; }
    .hook { font-size: 15px; margin-bottom: 18px; }
    
    .note-card { background: rgba(14, 165, 233, 0.07); border-left: 4px solid #00f0ff; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; font-size: 14px; color: #f1f5f9; line-height: 1.65; }
    .feature-card { background-color: #162032; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; }
    .feature-title { color: #ffffff; font-weight: 700; font-size: 15.5px; }
    .metric { color: #34d399; font-weight: 700; }
    .list { margin: 14px 0; padding-left: 20px; }
    .list li { margin-bottom: 10px; }

    .portfolios-grid { margin: 24px 0; padding: 18px; background: #0c121e; border: 1px solid #1e293b; border-radius: 10px; }
    .portfolio-item { margin-bottom: 12px; padding: 10px 14px; background: #131b2c; border: 1px solid #233149; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; }
    .portfolio-title { font-weight: 600; color: #f8fafc; font-size: 13.5px; }
    .portfolio-link { color: #38bdf8; text-decoration: none; font-weight: 700; font-size: 12.5px; background: rgba(56, 189, 248, 0.12); padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.25); }
    
    .cta-card { background: linear-gradient(180deg, #131d2e 0%, #0d1522 100%); border: 1px dashed #00f0ff; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center; }
    .cta-heading { color: #00f0ff; font-size: 14.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 7px; margin-top: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); }
    .footer { background-color: #0b0f17; padding: 20px 30px; border-top: 1px solid #1a2233; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="badge">Creator Growth &amp; Branding</div>
        <h1 class="title">Scaling Audience &amp; Click-Through for ${channelName}</h1>
      </div>
      <div class="content">
        <p class="hook">Hey <strong>${creatorName}</strong>,</p>
        <p>I’ve been closely tracking your uploads on <strong>${channelName}</strong>—the editorial pacing, production consistency, and audience retention benchmark you set is incredible.</p>

        ${formattedCustomNote ? `<div class="note-card">${formattedCustomNote}</div>` : ''}

        <p>Beyond design and web development, we also tap into high-leverage localization:</p>

        <div class="feature-card">
          <div class="feature-title">Secondary Growth: AI English-to-Bengali Video Dubbing</div>
          <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #94a3b8;">
            Tap into the <span class="metric">250M+ native Bengali demographic</span> across Bangladesh and West Bengal with zero operational overhead on your end.
          </p>
        </div>

        <div class="portfolios-grid">
          <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
            Verified Live Portfolios &amp; Case Studies:
          </div>

          <div class="portfolio-item">
            <span class="portfolio-title">🎨 Graphic Design &amp; High-CTR Thumbnail Portfolio</span>
            <a href="${designLink}" target="_blank" class="portfolio-link">View Design Portfolio &rarr;</a>
          </div>

          <div class="portfolio-item">
            <span class="portfolio-title">💻 Website Make &amp; Full-Stack Dev Portfolio</span>
            <a href="${devLink}" target="_blank" class="portfolio-link">View Website Portfolio &rarr;</a>
          </div>

          ${proofLinks.dubbing ? `
          <div class="portfolio-item">
            <span class="portfolio-title">🎙️ AI Bengali Dubbing Samples Showcase</span>
            <a href="${dubbingLink}" target="_blank" class="portfolio-link">Listen Samples &rarr;</a>
          </div>` : ''}
        </div>

        <div class="cta-card">
          <div class="cta-heading">Zero-Risk Free Test Offer</div>
          <p style="margin: 6px 0 12px 0; font-size: 13.5px; color: #cbd5e1;">
            I can design 1 free concept thumbnail for your next video OR dub a 60-second test clip so you can judge the quality yourself. Zero commitment.
          </p>
          <a href="mailto:${smtpUser}?subject=Send%20Free%20Thumbnail%20or%20Dub%20Test%20for%20${encodeURIComponent(channelName)}" class="cta-button">Claim Free Test Sample</a>
        </div>

        <p style="margin-top: 22px; font-size: 14px;">
          Would you be open to letting me send over a free concept thumbnail or 60-second sample for your next upload?
        </p>

        <p style="margin-bottom: 0;">
          Best regards,<br>
          <strong style="color: #ffffff;">${senderName}</strong><br>
          <span style="font-size: 12.5px; color: #64748b;">Creator Growth, Design &amp; Web Development Specialist</span>
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

${customNote ? `${customNote}\n\n` : ''}Quick proposition:
I help international creators with 3 high-impact growth pillars:
1. High-CTR Thumbnail Design (Tested for 12-16%+ CTR)
2. Custom Creator Website Development & Interactive Web Hubs
3. Complete Graphic Design & Visual Brand Identity

Verified Portfolios:
- 🎨 Design & Thumbnails: ${designLink}
- 💻 Website & Dev Hub: ${devLink}
${proofLinks.dubbing ? `- 🎙️ Dubbing Showcase: ${dubbingLink}` : ''}

Zero-Risk Offer:
Let me design 1 free concept thumbnail or an alternative layout for your next video at ZERO cost so you can judge the quality yourself with zero commitment.

Would you be open to seeing a free test concept?

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

        // 5. Enforce Anti-Spam Delay (20 to 30s) between dispatches (skip on final email or if only 1 lead)
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
