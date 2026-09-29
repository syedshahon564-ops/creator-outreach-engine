# CREATOR OUTREACH ENGINE // AI DUB & DEV SUITE

Production-grade, highly aesthetic **YouTuber Cold Outreach & Email Automation SaaS Dashboard** built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Nodemailer**.

Designed for high-leverage outreach pitching **AI English-to-Bengali Video Dubbing (250M+ demographic)**, **high-CTR custom thumbnails**, and **custom Discord/esports automation bots & web dev** to top YouTube creators.

---

## ⚡ Architectural Highlights

1. **Aesthetic UI**:
   - Dark Obsidian Cyberpunk theme (`#0B0F17`)
   - Subtle border accents (`border-slate-800`), glassmorphism cards (`backdrop-blur-md`)
   - Glowing emerald & cyan telemetry indicators and pulsing radar elements

2. **Real Nodemailer Node.js Engine (Zero Mocking)**:
   - Full TLS/SSL SMTP transporter integration with Gmail and custom relays
   - Real-time Server-Sent Events (SSE) streaming progress and latency directly to the frontend telemetry terminal
   - Real Google SMTP verification (`transporter.verify()`) with latency monitoring

3. **Dynamic AI-Tuned Pitch Engine (`lib/pitchEngine.ts`)**:
   - **Personalized Niche Hook**: Tailors praise and observations based on the creator's channel niche (Tech, Gaming, Video Essay, Science, Finance, Lifestyle, etc.).
   - **Core Offer**: AI English-to-Bengali Video Dubbing tapping into 250M+ native Bengali speakers (voice cloning, natural colloquial phrasing, lip-sync precision).
   - **Secondary Value-Adds**: High-CTR Gaming/Tech Thumbnails (12%+ CTR benchmark) & Custom Esports/Discord automation bots and web platforms.
   - **Zero-Friction CTA**: *"I can dub a free 60-second test clip from your latest video so you can judge the voice accuracy and quality yourself."*
   - **Dynamic Portfolio & Review Links**: Auto-injected showcase links.
   - **Dual Output**: Generates both polished responsive HTML and clean Plain-Text for 100% spam-filter deliverability.

4. **Safety & Anti-Spam Throttle**:
   - Configurable delay (20–40s cooldown) between email dispatches to protect Gmail sender reputation and prevent spam filter flagging.
   - Live visual countdown and cool-down timer in the dashboard.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure SMTP Credentials
Create or edit `.env.local` (or enter credentials directly in the Dashboard UI):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password

SENDER_NAME="Alex // Localization & AI Dev Lead"
PORTFOLIO_URL="https://drive.google.com/drive/folders/sample-dubbing-showcase"
REVIEW_URL="https://bengali-dub-hub.vercel.app/reviews"
```

> **How to generate a Gmail App Password:**
> 1. Go to your **Google Account** > **Security**.
> 2. Ensure **2-Step Verification** is enabled.
> 3. Go to **App Passwords** (search in Google Account if hidden).
> 4. Create an App Password with name "Creator Outreach" and copy the 16 characters (e.g., `abcd efgh ijkl mnop`).
> 5. Paste it into the dashboard or `.env.local`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📋 Mission Control Features

- **Header Panel**: Live SMTP status badge (online ping / latency / error detection), Queue count, Delivered count, Failed count, and Daily Gmail Quota meter (`X / 500 Daily Limit`).
- **Left Column**:
  - **Credentials Quick-Config**: Smtp user/pass inputs, custom host/port accordion, anti-spam delay slider (5s to 60s).
  - **Live Pitch Client**: Realistic email preview client with responsive HTML and plain-text tabs, and selector to preview pitches across different creators in your queue.
- **Right Column**:
  - **Target Leads Matrix**: Add leads manually, click **"Load 5 Targets"** for sample creators, or use the **Bulk CSV / JSON Import** modal.
  - **Launch Controls**: Animated "INITIATE CAMPAIGN DISPATCH" button with active countdown display and instant campaign halting.
  - **Audit Ledger Table**: Real-time status badges (`Pending`, `Sending`, `Delivered`, `Failed`) with delivery latency and message IDs.
  - **Telemetry Terminal**: Dark obsidian console streaming logs (`[DISPATCHED] Successfully sent pitch to creator@channel.com (Delivered in 840ms)`).
