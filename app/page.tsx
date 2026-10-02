'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Link as LinkIcon,
  User,
  FileText,
  Play,
  Square,
  Copy,
  Trash2,
  Check,
  ExternalLink,
  Plus,
  Key,
  Mail,
  Tv,
  ListPlus,
  Layers,
  Zap,
} from 'lucide-react';

interface ProofLinks {
  dubbing: string;
  design: string;
  dev: string;
}

interface QueuedCreator {
  id: string;
  creatorName: string;
  channelName: string;
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
}

interface LogEntry {
  id: string;
  timestamp: string;
  status?: 'SENT' | 'FAILED' | 'DISPATCHING' | 'COUNTDOWN' | 'INIT' | 'COMPLETED' | 'ABORTED';
  channel?: string;
  email?: string;
  latency?: number;
  message: string;
}

const DEFAULT_CUSTOM_NOTE = `I specialize in 3 high-impact growth services specifically engineered for top YouTube creators:

1. 🎯 High-CTR Thumbnail Design:
We don't just design "pretty images"—we engineer click psychology, visual contrast, and curiosity cues tested to push 12%–16%+ CTR so your uploads get the views they deserve.
📁 Design & Thumbnail Portfolio: https://syedshahon564-ops.github.io/

2. 💻 Custom Creator Website Development:
Ultra-fast modern creator websites, sponsorship media-kits, automated merch/community hubs, and interactive web tools built with production-grade full-stack tech.
⚡ Dev & Web Portfolio: https://syedshahon564-ops.github.io/danger-shawon/

3. 🎨 Full Brand Identity & Graphic Design:
Sleek channel branding, high-end YouTube banners, social media design kits, and cohesive visual identities that elevate your channel into a multi-million-dollar media brand.

⚡ Zero-Risk Guarantee: I don't expect you to take my word for it. Let me design 1 free concept thumbnail or create an alternative design for your next video at ZERO cost so you can judge the quality yourself.`;

export default function OutreachDashboard() {
  // Campaign Persona & Proofs
  const [senderName, setSenderName] = useState('Syed Shawon // Creative Director & Full-Stack Engineer');
  const [proofLinks, setProofLinks] = useState<ProofLinks>({
    design: 'https://syedshahon564-ops.github.io/',
    dev: 'https://syedshahon564-ops.github.io/danger-shawon/',
    dubbing: 'https://drive.google.com/drive/folders/sample-dubbing-showcase',
  });
  const [customNote, setCustomNote] = useState(DEFAULT_CUSTOM_NOTE);

  // Optional SMTP Credentials override
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  // Single Creator Input State (The Easy Form)
  const [creatorName, setCreatorName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [email, setEmail] = useState('');

  // Queue of Creators
  const [queuedCreators, setQueuedCreators] = useState<QueuedCreator[]>([
    {
      id: 'q1',
      creatorName: 'Linus',
      channelName: 'Linus Tech Tips',
      email: 'linus.sample@lmgstudios.com',
      status: 'pending',
    },
    {
      id: 'q2',
      creatorName: 'Mark',
      channelName: 'Mark Rober',
      email: 'mark.sample@crunchlabs.com',
      status: 'pending',
    },
  ]);

  // Bulk input mode toggle
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkCsvText, setBulkCsvText] = useState('');

  // Execution & Telemetry State
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentSendingTarget, setCurrentSendingTarget] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ sent: 0, failed: 0 });
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [lastSuccessNotice, setLastSuccessNotice] = useState<string | null>(null);

  // Live Terminal Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      status: 'INIT',
      message: 'System ready. Enter creator name, channel name, and email to send pitch.',
    },
  ]);

  const [copiedLogs, setCopiedLogs] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const creatorNameInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 1. Send Pitch Directly to Current Input Creator
  const handleSendSingleNow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!creatorName.trim() || !channelName.trim() || !email.trim()) {
      alert('Please fill out Creator Name, Channel Name, and Email.');
      return;
    }

    if (!email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const singleLead = {
      creatorName: creatorName.trim(),
      channelName: channelName.trim(),
      email: email.trim(),
    };

    setIsDispatching(true);
    setCurrentSendingTarget(`${singleLead.channelName} (${singleLead.email})`);
    setProgress({ current: 0, total: 1 });
    setCooldownSeconds(null);
    setLastSuccessNotice(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [singleLead],
          senderName,
          customNote,
          proofLinks,
          smtpUser: smtpUser.trim() || undefined,
          smtpPass: smtpPass.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/);
          if (match) {
            try {
              const event = JSON.parse(match[1]);
              handleStreamEvent(event);
            } catch (err) {
              console.error('SSE parse error:', err);
            }
          }
        }
      }

      // Success! Clear inputs so user can easily enter the next creator
      setLastSuccessNotice(`Pitch successfully dispatched to ${singleLead.creatorName} (${singleLead.email})!`);
      setCreatorName('');
      setChannelName('');
      setEmail('');
      creatorNameInputRef.current?.focus();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setLogs((prev) => [
          ...prev,
          {
            id: `abort-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'ABORTED',
            message: '[ABORT] Dispatch halted.',
          },
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'FAILED',
            message: `[ERROR] ${err.message}`,
          },
        ]);
      }
    } finally {
      setIsDispatching(false);
      setCurrentSendingTarget(null);
      setCooldownSeconds(null);
      abortControllerRef.current = null;
    }
  };

  // 2. Add current input creator to Queue
  const handleAddToQueue = () => {
    if (!creatorName.trim() || !channelName.trim() || !email.trim()) {
      alert('Please fill out Creator Name, Channel Name, and Email.');
      return;
    }

    if (!email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const newCreator: QueuedCreator = {
      id: `q-${Date.now()}`,
      creatorName: creatorName.trim(),
      channelName: channelName.trim(),
      email: email.trim(),
      status: 'pending',
    };

    setQueuedCreators((prev) => [...prev, newCreator]);
    setCreatorName('');
    setChannelName('');
    setEmail('');
    creatorNameInputRef.current?.focus();
  };

  // 3. Import Bulk CSV into Queue
  const handleImportBulkCsv = () => {
    if (!bulkCsvText.trim()) return;

    const parsed = bulkCsvText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        return {
          id: `bulk-${Date.now()}-${idx}`,
          creatorName: parts[0] || 'Creator',
          channelName: parts[1] || 'Channel',
          email: parts[2] || '',
          status: 'pending' as const,
        };
      })
      .filter((c) => c.email.includes('@'));

    if (parsed.length === 0) {
      alert('No valid rows found. Format: CreatorName, ChannelName, Email');
      return;
    }

    setQueuedCreators((prev) => [...prev, ...parsed]);
    setBulkCsvText('');
    setInputMode('single');
  };

  // 4. Dispatch All Queued Creators (with Anti-Spam Cooldown)
  const handleStartQueueDispatch = async () => {
    const pendingLeads = queuedCreators.filter((c) => c.status === 'pending');

    if (pendingLeads.length === 0) {
      alert('No pending creators in queue. Add someone above first.');
      return;
    }

    setIsDispatching(true);
    setProgress({ current: 0, total: pendingLeads.length });
    setStats({ sent: 0, failed: 0 });
    setCooldownSeconds(null);
    setLastSuccessNotice(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: pendingLeads.map((p) => ({
            creatorName: p.creatorName,
            channelName: p.channelName,
            email: p.email,
          })),
          senderName,
          customNote,
          proofLinks,
          smtpUser: smtpUser.trim() || undefined,
          smtpPass: smtpPass.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/);
          if (match) {
            try {
              const event = JSON.parse(match[1]);
              handleStreamEvent(event);
            } catch (err) {
              console.error('SSE parse error:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setLogs((prev) => [
          ...prev,
          {
            id: `abort-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'ABORTED',
            message: '[ABORT] Batch dispatch halted.',
          },
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            status: 'FAILED',
            message: `[ERROR] ${err.message}`,
          },
        ]);
      }
    } finally {
      setIsDispatching(false);
      setCurrentSendingTarget(null);
      setCooldownSeconds(null);
      abortControllerRef.current = null;
    }
  };

  const handleStreamEvent = (event: any) => {
    const timestamp = new Date().toLocaleTimeString();

    if (event.type === 'COUNTDOWN') {
      setCooldownSeconds(event.remainingSeconds);
      if (event.remainingSeconds % 5 === 0 || event.remainingSeconds <= 3) {
        setLogs((prev) => [
          ...prev,
          {
            id: `cd-${Date.now()}-${event.remainingSeconds}`,
            timestamp,
            status: 'COUNTDOWN',
            message: event.message,
          },
        ]);
      }
      return;
    }

    setCooldownSeconds(null);

    if (event.status === 'SENT') {
      setStats((prev) => ({ ...prev, sent: prev.sent + 1 }));
      setProgress((prev) => ({ ...prev, current: event.index }));

      // Update queue item status
      if (event.email) {
        setQueuedCreators((prev) =>
          prev.map((c) => (c.email === event.email ? { ...c, status: 'sent' } : c))
        );
      }

      setLogs((prev) => [
        ...prev,
        {
          id: `sent-${Date.now()}`,
          timestamp,
          status: 'SENT',
          channel: event.channel,
          email: event.email,
          latency: event.latency,
          message: event.message,
        },
      ]);
    } else if (event.status === 'FAILED') {
      setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
      setProgress((prev) => ({ ...prev, current: event.index }));

      if (event.email) {
        setQueuedCreators((prev) =>
          prev.map((c) => (c.email === event.email ? { ...c, status: 'failed' } : c))
        );
      }

      setLogs((prev) => [
        ...prev,
        {
          id: `fail-${Date.now()}`,
          timestamp,
          status: 'FAILED',
          channel: event.channel,
          email: event.email,
          latency: event.latency,
          message: event.message,
        },
      ]);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          id: `event-${Date.now()}-${Math.random()}`,
          timestamp,
          status: event.type,
          channel: event.channel,
          email: event.email,
          message: event.message,
        },
      ]);
    }
  };

  const handleAbort = () => {
    abortControllerRef.current?.abort();
  };

  const handleRemoveQueued = (id: string) => {
    setQueuedCreators((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const pendingCount = queuedCreators.filter((c) => c.status === 'pending').length;

  return (
    <main className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 md:p-6 lg:p-8 font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto mb-6 bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-0 left-1/3 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                DIRECT CREATOR DISPATCHER
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                THUMBNAILS &bull; WEBSITES &bull; BRANDING
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300">
                CREATOR OUTREACH ENGINE
              </span>
              <span className="text-slate-600 font-mono text-xl font-light">//</span>
              <span className="text-slate-400 text-lg md:text-xl font-medium tracking-wide">
                SHAWON SUITE
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Enter a creator’s name, channel, and email to dispatch a personalized pitch with your live portfolios in seconds.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#0a0d14] px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Queue:</span>
              <strong className="text-slate-200">{pendingCount}</strong>
            </div>
            <div className="bg-[#0a0d14] px-3.5 py-2 rounded-xl border border-emerald-900/50 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Sent:</span>
              <strong className="text-emerald-400">{stats.sent}</strong>
            </div>
            <div className="bg-[#0a0d14] px-3.5 py-2 rounded-xl border border-rose-900/50 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-400">Failed:</span>
              <strong className="text-rose-400">{stats.failed}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Command Center Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) - Persona & Portfolios */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                    PITCH PERSONA &amp; PORTFOLIOS
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Live Verified Portfolios &amp; Irresistible Offer
                  </p>
                </div>
              </div>
            </div>

            {/* Sender Identity */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>SENDER IDENTITY / BRAND TITLE</span>
              </label>
              <input
                type="text"
                disabled={isDispatching}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Syed Shawon // Creative Director & Full-Stack Engineer"
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Verified Portfolio Links */}
            <div className="space-y-3 pt-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>VERIFIED PORTFOLIO LINKS (AUTO-INJECTED INTO EMAIL)</span>
              </span>

              {/* Graphics Design Portfolio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span>1. Graphics Design &amp; High-CTR Thumbnail Portfolio</span>
                  </label>
                  <a
                    href={proofLinks.design}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.design}
                  onChange={(e) => setProofLinks({ ...proofLinks, design: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Dev & Website Portfolio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span>2. Website Make &amp; Full-Stack Dev Portfolio</span>
                  </label>
                  <a
                    href={proofLinks.dev}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.dev}
                  onChange={(e) => setProofLinks({ ...proofLinks, dev: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Dubbing Sample Link */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  3. AI Voice Dubbing Sample Showcase (Drive / Cloud)
                </label>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.dubbing}
                  onChange={(e) => setProofLinks({ ...proofLinks, dubbing: e.target.value })}
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Custom Authority Pitch Note */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AUTHORITY PITCH NOTE (HIGHLIGHTED IN EMAIL)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCustomNote(DEFAULT_CUSTOM_NOTE)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                >
                  Reset Template
                </button>
              </div>
              <textarea
                rows={6}
                disabled={isDispatching}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition leading-relaxed resize-none"
              />
            </div>

            {/* Optional Gmail SMTP Credentials Override */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                className="flex items-center justify-between w-full text-xs font-mono text-slate-400 hover:text-slate-200 transition py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gmail SMTP Setup ({smtpUser ? 'Configured' : 'Using .env.local'})</span>
                </span>
                <span className="text-[10px] text-cyan-400">{showSmtpConfig ? '▲ Hide' : '▼ Set Password'}</span>
              </button>

              {showSmtpConfig && (
                <div className="mt-3 p-3.5 rounded-xl bg-[#0a0d14] border border-slate-800 space-y-3 font-mono">
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      Your Gmail Address
                    </label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 mb-1">
                      16-Character App Password
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="abcd efgh ijkl mnop"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Generate this from Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols) - Quick Single Creator Dispatch & Queue */}
        <div className="lg:col-span-7 space-y-5 flex flex-col">
          {/* Main Direct Input Form */}
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                    Direct Creator Pitch Form
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Fill in the 3 details and dispatch immediately or queue up
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex bg-[#0a0d14] rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setInputMode('single')}
                  className={`px-3 py-1 rounded transition ${
                    inputMode === 'single'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Form
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('bulk')}
                  className={`px-3 py-1 rounded transition ${
                    inputMode === 'bulk'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bulk CSV
                </button>
              </div>
            </div>

            {/* Success Toast Notice */}
            {lastSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lastSuccessNotice}</span>
                </div>
                <button
                  onClick={() => setLastSuccessNotice(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Direct Form Inputs */}
            {inputMode === 'single' ? (
              <form onSubmit={handleSendSingleNow} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Creator Name */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Creator Name</span>
                    </label>
                    <input
                      ref={creatorNameInputRef}
                      type="text"
                      disabled={isDispatching}
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="e.g. Linus"
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {/* 2. YouTube Channel Name */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5 text-cyan-400" />
                      <span>2. Channel Name</span>
                    </label>
                    <input
                      type="text"
                      disabled={isDispatching}
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g. Linus Tech Tips"
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {/* 3. Email */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3. Creator Email</span>
                    </label>
                    <input
                      type="email"
                      disabled={isDispatching}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. linus@channel.com"
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Action Buttons for Single Form */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Auto-clears inputs after send so you can do the next person instantly.</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={isDispatching || !creatorName || !channelName || !email}
                      onClick={handleAddToQueue}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 transition disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Queue</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isDispatching || !creatorName || !channelName || !email}
                      className="relative overflow-hidden flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-400 text-black hover:scale-[1.02] active:scale-[0.99] transition shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                      <span>{isDispatching ? 'SENDING PITCH...' : 'SEND PITCH NOW'}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Bulk CSV Mode */
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="MrBeast, MrBeast, beast@mrbeast.com&#10;Linus, Linus Tech Tips, linus@lmgstudios.com"
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImportBulkCsv}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs transition"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>Import to Queue</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Queue Section */}
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                    Batch Queue ({queuedCreators.length} Targets)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {pendingCount} pending &bull; Anti-spam safe throttle active
                  </p>
                </div>
              </div>

              {isDispatching ? (
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-950 border border-rose-700 text-rose-300 font-mono text-xs font-bold transition hover:bg-rose-900"
                >
                  <Square className="w-3 h-3 fill-rose-300" />
                  <span>Halt</span>
                </button>
              ) : (
                <button
                  disabled={pendingCount === 0}
                  onClick={handleStartQueueDispatch}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:scale-[1.01] transition disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-emerald-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch All ({pendingCount})</span>
                </button>
              )}
            </div>

            {/* Active Cooldown Banner */}
            {cooldownSeconds !== null && cooldownSeconds > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-800/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Anti-Spam Cooling Active: <strong>{cooldownSeconds}s</strong> remaining before next creator...</span>
              </div>
            )}

            {/* Queue List Cards */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {queuedCreators.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-slate-500">
                  Queue is empty. Enter creator details in the form above.
                </div>
              ) : (
                queuedCreators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a0d14] border border-slate-800 hover:border-slate-700 transition font-mono text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {c.channelName} <span className="text-slate-400 font-normal">({c.creatorName})</span>
                      </div>
                      <div className="text-[11px] text-cyan-400">{c.email}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      {c.status === 'sent' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
                          SENT
                        </span>
                      )}
                      {c.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-400 border border-rose-800/60 font-semibold">
                          FAILED
                        </span>
                      )}
                      {c.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                          PENDING
                        </span>
                      )}

                      <button
                        disabled={isDispatching}
                        onClick={() => handleRemoveQueued(c.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition disabled:opacity-40"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-Time Live Telemetry Terminal */}
          <div className="bg-[#070a0f] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="bg-[#0f1623] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
                  Live Dispatch Telemetry Terminal
                </span>
                {isDispatching && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 ml-2 animate-pulse">
                    STREAMING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition text-xs"
                  title="Copy terminal logs"
                >
                  {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="p-1 rounded-md bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition text-xs"
                  title="Clear terminal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-2 bg-[#05070a] relative max-h-[320px]">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-600 select-none text-[11px] shrink-0">
                    {log.timestamp}
                  </span>

                  {log.status === 'SENT' && (
                    <span className="text-emerald-400 flex items-center gap-1 shrink-0 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>[SENT]</span>
                    </span>
                  )}

                  {log.status === 'FAILED' && (
                    <span className="text-rose-400 flex items-center gap-1 shrink-0 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>[FAILED]</span>
                    </span>
                  )}

                  {log.status === 'COUNTDOWN' && (
                    <span className="text-amber-400 shrink-0 font-semibold">
                      [THROTTLE]
                    </span>
                  )}

                  <span
                    className={`break-all ${
                      log.status === 'SENT'
                        ? 'text-emerald-300'
                        : log.status === 'FAILED'
                        ? 'text-rose-300'
                        : log.status === 'COUNTDOWN'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.message}
                    {log.latency !== undefined && (
                      <span className="text-slate-500 ml-1.5 text-[10px]">
                        ({log.latency}ms)
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
