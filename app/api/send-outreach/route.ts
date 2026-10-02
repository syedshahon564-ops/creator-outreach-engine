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
  design?: string;
  dev?: string;
  extra?: string;
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

// Auto-linkify URLs and preserve linebreaks in custom note
function formatCustomNoteToHtml(note: string): string {
  if (!note) return '';
  const escaped = note
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const linkified = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" style="color: #00f0ff; text-decoration: underline; font-weight: 600;">$1</a>'
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
    senderName = 'Syed Shawon // Designer & Full-Stack Web Developer',
    customNote = '',
    proofLinks = {
      design: 'https://syedshahon564-ops.github.io/',
      dev: 'https://syedshahon564-ops.github.io/danger-shawon/',
    },
  } = body;

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
        message: `[MISSION ENGINE] Campaign initialized. Processing ${leads.length} creator targets.`,
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

        // Dynamic High-Converting Subject Line tailored to Thumbnail CTR & Custom Website
        const subject = `Quick concept for ${channelName} | High-CTR Thumbnails & Custom Website`;

        const designLink = proofLinks.design || 'https://syedshahon564-ops.github.io/';
        const devLink = proofLinks.dev || 'https://syedshahon564-ops.github.io/danger-shawon/';
        const formattedCustomNote = formatCustomNoteToHtml(customNote);

        // High-Converting Personalized HTML Pitch Body (Focused on: Thumbnails + Websites + Graphic Design)
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
    .hook { font-size: 15px; margin-bottom: 16px; }
    
    .note-card { background: rgba(14, 165, 233, 0.08); border-left: 4px solid #00f0ff; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; font-size: 14px; color: #f1f5f9; line-height: 1.65; }
    
    .services-grid { margin: 22px 0; display: grid; gap: 14px; }
    .service-card { background-color: #162032; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; }
    .service-card-title { color: #ffffff; font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .service-card-desc { font-size: 13.5px; color: #94a3b8; margin: 0; }
    .metric { color: #34d399; font-weight: 700; }

    .portfolios-grid { margin: 24px 0; padding: 18px; background: #0c121e; border: 1px solid #1e293b; border-radius: 10px; }
    .portfolio-item { margin-bottom: 12px; padding: 12px 16px; background: #131b2c; border: 1px solid #233149; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; }
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
        <div class="badge">Visuals &bull; Web Infrastructure &bull; CTR Scale</div>
        <h1 class="title">Scaling Visuals &amp; Web Presence for ${channelName}</h1>
      </div>
      <div class="content">
        <p class="hook">Hey <strong>${creatorName}</strong>,</p>
        <p>I’ve been following your uploads on <strong>${channelName}</strong>—the editorial pacing, storytelling, and high-energy engagement consistently set the benchmark in your space.</p>

        ${formattedCustomNote ? `<div class="note-card">${formattedCustomNote}</div>` : ''}

        <p>I specialize as a dedicated Creative Designer &amp; Full-Stack Web Developer partnering with creators to solve 3 core revenue &amp; audience drivers:</p>

        <div class="services-grid">
          <div class="service-card" style="border-left-color: #00f0ff;">
            <div class="service-card-title">1. High-CTR Thumbnail Design</div>
            <p class="service-card-desc">
              Psychology-driven visual hierarchy, color grading, and facial focal points engineered to achieve <span class="metric">12% to 16%+ CTR</span> in competitive feeds. No cluttered templates—pure click conversion.
            </p>
          </div>

          <div class="service-card" style="border-left-color: #10b981;">
            <div class="service-card-title">2. Custom Website Making (Web Development)</div>
            <p class="service-card-desc">
              Bespoke, high-speed modern websites for ${channelName} (Next.js/React). Perfect for your creator brand, sponsorship media kit, merch showcase, fan community, or interactive web apps.
            </p>
          </div>

          <div class="service-card" style="border-left-color: #8b5cf6;">
            <div class="service-card-title">3. Channel Branding &amp; Graphic Design</div>
            <p class="service-card-desc">
              Complete visual identity: YouTube channel banners, stream overlays, motion graphics assets, and social media brand kits that make your channel look like a tier-1 media brand.
            </p>
          </div>
        </div>

        <div class="portfolios-grid">
          <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
            Verified Live Portfolios &amp; Case Studies:
          </div>

          <div class="portfolio-item">
            <span class="portfolio-title">🎨 Graphic Design &amp; High-CTR Thumbnail Portfolio</span>
            <a href="${designLink}" target="_blank" class="portfolio-link">View Design Work &rarr;</a>
          </div>

          <div class="portfolio-item">
            <span class="portfolio-title">💻 Custom Website &amp; Dev Portfolio</span>
            <a href="${devLink}" target="_blank" class="portfolio-link">View Web Projects &rarr;</a>
          </div>
        </div>

        <div class="cta-card">
          <div class="cta-heading">Zero-Risk Free Sample Offer</div>
          <p style="margin: 6px 0 12px 0; font-size: 13.5px; color: #cbd5e1;">
            I don't expect you to take my word for it. Send me your next video title, and I will design a free high-CTR test thumbnail for your upcoming upload (or draft a 1-page custom website mock for ${channelName}) completely free.
          </p>
          <a href="mailto:${smtpUser}?subject=Free%20Thumbnail%20or%20Website%20Test%20for%20${encodeURIComponent(channelName)}" class="cta-button">Claim Free Test Concept</a>
        </div>

        <p style="margin-top: 22px; font-size: 14px;">
          Would you be open to seeing a free test thumbnail concept for your upcoming upload?
        </p>

        <p style="margin-bottom: 0;">
          Best regards,<br>
          <strong style="color: #ffffff;">${senderName}</strong><br>
          <span style="font-size: 12.5px; color: #64748b;">Designer &amp; Full-Stack Web Developer</span>
        </p>
      </div>

      <div class="footer">
        Delivered via Creator Outreach Engine // Direct creator inquiry. Reply with "unsub" if you prefer not to receive updates.
      </div>
    </div>
  </div>
</body>
</html>`;

        // Plain Text Alternative for 100% deliverability
        const textBody = `Hey ${creatorName},

I’ve been following ${channelName} and really admire the quality and consistency you bring to every video.

${customNote ? `${customNote}\n\n` : ''}Quick proposition:
I help top creators scale their views and brand presence across 3 key services:

1. 🎨 High-CTR Thumbnail Design: Click-tested, psychology-driven thumbnails engineered for 12-16%+ CTR.
   Verified Design Portfolio: ${designLink}

2. 💻 Custom Website Development: Fast, responsive, dark-aesthetic modern websites for ${channelName} (sponsorship deck, merch, community web hub).
   Verified Web Dev Portfolio: ${devLink}

3. 🚀 Graphic Design & Channel Branding: High-end channel art, banners, overlays, and social visual kits.

Zero-Risk Offer:
Send me your upcoming video title and I will design a custom high-CTR test thumbnail for free (or build a 1-page web concept for ${channelName}) so you can judge the quality yourself with zero commitment.

Would you be open to seeing a free test thumbnail for your next upload?

Best regards,
${senderName}
${smtpUser}`;

        // Send Email via Transporter
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

        // Enforce Anti-Spam Delay (20 to 30s) between dispatches (skip on final email)
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
