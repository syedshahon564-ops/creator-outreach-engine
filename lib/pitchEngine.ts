import { PitchParams, PitchOutput } from '@/types/outreach';

/**
 * Returns dynamic, authentic creator hooks based on channel niche
 */
function getNicheSpecificHook(niche: string, channelName: string, creatorName: string): string {
  const normalized = (niche || '').toLowerCase();

  if (normalized.includes('game') || normalized.includes('gaming') || normalized.includes('esport')) {
    return `Huge fan of your gameplay pacing and narrative commentary on ${channelName}. The high-energy moments and edits are top tier.`;
  } else if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('code') || normalized.includes('hardware')) {
    return `I’ve been closely tracking your tech teardowns and breakdowns on ${channelName}—the clarity and production benchmark you set is incredible.`;
  } else if (normalized.includes('essay') || normalized.includes('documentary') || normalized.includes('cinema') || normalized.includes('story')) {
    return `The depth of research and storytelling on ${channelName} is rare on YouTube. Your narrative structure keeps viewers hooked until the final second.`;
  } else if (normalized.includes('finance') || normalized.includes('business') || normalized.includes('crypto')) {
    return `Your breakdowns on ${channelName} simplify complex market dynamics better than 99% of creators in the space.`;
  } else if (normalized.includes('vlog') || normalized.includes('lifestyle') || normalized.includes('fitness')) {
    return `Really admire the raw authenticity and high-energy community you’ve cultivated around ${channelName}.`;
  }

  return `I’ve been following ${channelName} for a while now—your recent uploads and engagement quality consistently stand out in the ${niche || 'content'} space.`;
}

/**
 * AI-Tuned Pitch Engine
 * Generates both highly deliverable Plain Text and aesthetically formatted HTML email
 */
export function generatePitch(params: PitchParams): PitchOutput {
  const { creatorName, channelName, niche, senderName, senderEmail, portfolioUrl, reviewUrl } = params;

  const hook = getNicheSpecificHook(niche, channelName, creatorName);
  const subject = `Bengali dub test for ${channelName} (Free 60s sample clip)`;

  // Clean Plain Text Email (for maximum inboxing and deliverability)
  const text = `Hey ${creatorName},

${hook}

Quick direct proposition:

I lead a specialized studio that helps international creators unlock the 250M+ native Bengali demographic (Bangladesh & West Bengal) with zero friction on your end.

1. CORE VALUE: Professional AI English-to-Bengali Video Dubbing
We combine neural voice cloning, natural colloquial adaptations (not robotic Google-translate phrasing), and subtle audio-syncing. Bengali viewers consume tens of billions of watch-time minutes monthly, yet tier-1 creators rarely localize for them. By tapping this market, creators routinely see 15-35% subscriber growth and fresh AdSense revenue.

2. SECONDARY VALUE-ADDS:
• High-CTR Gaming/Tech Custom Thumbnails (A/B tested for 12%+ CTR)
• Custom Discord/Esports Automation Bots & Interactive Web Hubs

3. ZERO-RISK OFFER:
I don't expect you to take my word for it. Send me any 60-second clip from your latest ${channelName} video, or let me pick one, and I will dub it into Bengali for FREE within 24 hours.

If you love the voice match and quality, we can discuss localizing your catalog. If not, no hard feelings and you keep the sample clip.

Portfolio & dub samples: ${portfolioUrl || 'https://drive.google.com'}
Creator reviews & live case studies: ${reviewUrl || 'https://bengali-dub-hub.vercel.app/reviews'}

Would you be open to seeing a 60s test clip on your latest video?

Best regards,

${senderName}
Lead Localization & Dev Specialist
${senderEmail}`;

  // Rich HTML Email (Responsive, Dark Obsidian/Clean Hybrid, Crisp Typography)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f17;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f17;
      padding: 32px 16px;
    }
    .email-container {
      max-width: 620px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1f293d;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .email-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 24px 32px;
      border-bottom: 1px solid #1f293d;
    }
    .brand-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #00f0ff;
      background-color: rgba(0, 240, 255, 0.12);
      border: 1px solid rgba(0, 240, 255, 0.25);
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 10px;
    }
    .header-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .email-body {
      padding: 32px;
      color: #cbd5e1;
      font-size: 15px;
    }
    .highlight-card {
      background-color: #162032;
      border-left: 4px solid #10b981;
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .metric-badge {
      color: #34d399;
      font-weight: 700;
    }
    .feature-list {
      margin: 16px 0;
      padding-left: 20px;
    }
    .feature-list li {
      margin-bottom: 10px;
    }
    .cta-box {
      background: linear-gradient(180deg, #131d2e 0%, #0d1522 100%);
      border: 1px dashed #00f0ff;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 6px;
      margin-top: 14px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }
    .links-bar {
      margin: 20px 0;
      padding-top: 16px;
      border-top: 1px solid #1e293b;
      font-size: 13px;
    }
    .links-bar a {
      color: #38bdf8;
      text-decoration: none;
      margin-right: 18px;
      font-weight: 500;
    }
    .links-bar a:hover {
      text-decoration: underline;
    }
    .email-footer {
      background-color: #0b0f17;
      padding: 20px 32px;
      border-top: 1px solid #1a2233;
      font-size: 12px;
      color: #64748b;
    }
    .sender-info {
      font-weight: 600;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="brand-badge">250M+ Demographic Expansion</div>
        <h1 class="header-title">Unlocking South Asia Audience for ${channelName}</h1>
      </div>
      <div class="email-body">
        <p>Hey <strong>${creatorName}</strong>,</p>
        <p>${hook}</p>
        
        <p>I’m reaching out with a direct, high-leverage growth proposition for <strong>${channelName}</strong>:</p>

        <div class="highlight-card">
          <strong style="color: #ffffff; font-size: 16px;">Core Initiative: AI English-to-Bengali Video Dubbing</strong>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8;">
            Tapping into the <span class="metric-badge">250M+ native Bengali demographic</span> across Bangladesh and West Bengal with zero operational friction on your end.
          </p>
        </div>

        <p>Bengali viewers represent one of the fastest-growing watch-time cohorts on YouTube, yet tier-1 creators rarely localize their library for them. We provide:</p>

        <ul class="feature-list">
          <li><strong>Neural Voice Cloning & Nuance:</strong> Retains your exact vocal timbre, pacing, and infectious excitement (natural colloquial translation, never robotic).</li>
          <li><strong>Secondary Value-Adds:</strong> High-CTR Custom Thumbnails (tested for 12%+ CTR) + Custom Esports/Discord automation bots & web hubs.</li>
          <li><strong>Turnkey Execution:</strong> Audio stem replacement, subtitle alignment, and ready-to-publish files.</li>
        </ul>

        <div class="cta-box">
          <strong style="color: #00f0ff; font-size: 15px;">FREE 60-SECOND TEST OFFER</strong>
          <p style="margin: 6px 0 12px 0; font-size: 13.5px; color: #cbd5e1;">
            "I can dub a free 60-second test clip from your latest video so you can judge the voice accuracy and quality yourself."
          </p>
          <a href="mailto:${senderEmail}?subject=Send%2060s%20Dub%20Test%20for%20${encodeURIComponent(channelName)}" class="cta-button">Claim Free 60s Sample</a>
        </div>

        <div class="links-bar">
          ${portfolioUrl ? `📁 <a href="${portfolioUrl}" target="_blank">View Dubbing Portfolio & Samples</a>` : ''}
          ${reviewUrl ? `⭐ <a href="${reviewUrl}" target="_blank">Creator Reviews & Case Studies</a>` : ''}
        </div>

        <p style="margin-top: 24px; font-size: 14px;">
          Would you be open to letting me dub a 60-second sample of your latest upload?
        </p>

        <p style="margin-bottom: 0;">
          Best regards,<br>
          <span class="sender-info">${senderName}</span><br>
          <span style="font-size: 13px; color: #64748b;">Creator Localization & AI Dev Lead</span>
        </p>
      </div>

      <div class="email-footer">
        Delivered via Creator Outreach Engine // Direct creator-to-creator communication. If you prefer not to receive updates, reply with "unsub".
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
}
