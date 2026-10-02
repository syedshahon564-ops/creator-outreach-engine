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
  Flame,
  Check,
} from 'lucide-react';

interface ProofLinks {
  dubbing: string;
  design: string;
  dev: string;
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

const DEFAULT_CSV_SAMPLE = `Linus, Linus Tech Tips, linus.sample@lmgstudios.com
Mark, Mark Rober, mark.sample@crunchlabs.com
Shroud, Shroud, shroud.sample@loaded.gg
Dagogo, ColdFusion, dagogo.sample@coldfusionmedia.com`;

export default function OutreachDashboard() {
  // Campaign Configuration State
  const [senderName, setSenderName] = useState('Alex // AI Localization Lead');
  const [proofLinks, setProofLinks] = useState<ProofLinks>({
    dubbing: 'https://drive.google.com/drive/folders/sample-dubbing-showcase',
    design: 'https://behance.net/sample-high-ctr-thumbnails',
    dev: 'https://github.com/sample-creator-automation-bot',
  });
  const [customNote, setCustomNote] = useState('');

  // Leads & Execution State
  const [rawLeadsText, setRawLeadsText] = useState(DEFAULT_CSV_SAMPLE);
  const [isDispatching, setIsDispatching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ sent: 0, failed: 0 });
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  // Terminal Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      status: 'INIT',
      message: 'System ready. Configure campaign credentials and paste creator leads to initiate dispatch.',
    },
  ]);

  const [copiedLogs, setCopiedLogs] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Parse bulk CSV/Text into structured leads
  const parseLeads = (): { creatorName: string; channelName: string; email: string }[] => {
    return rawLeadsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        return {
          creatorName: parts[0] || 'Creator',
          channelName: parts[1] || 'Channel',
          email: parts[2] || '',
        };
      })
      .filter((lead) => lead.email.includes('@'));
  };

  const activeLeadsCount = parseLeads().length;

  // Handle Campaign Launch
  const handleStartCampaign = async () => {
    const leads = parseLeads();

    if (leads.length === 0) {
      alert('Please enter at least one valid lead in format: CreatorName, ChannelName, Email');
      return;
    }

    setIsDispatching(true);
    setProgress({ current: 0, total: leads.length });
    setStats({ sent: 0, failed: 0 });
    setCooldownSeconds(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          senderName,
          customNote,
          proofLinks,
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
            message: '[ABORT] Campaign manually halted by operator.',
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

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

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
                PRO-SCALE OUTREACH ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                250M+ BENGALI REACH
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300">
                YOUTUBER COLD OUTREACH
              </span>
              <span className="text-slate-600 font-mono text-xl font-light">//</span>
              <span className="text-slate-400 text-lg md:text-xl font-medium tracking-wide">
                AI DUB &amp; DEV SUITE
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Automated high-converting pitches for AI video localization, CTR thumbnails, and custom dev bots.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#0a0d14] px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Queue:</span>
              <strong className="text-slate-200">{activeLeadsCount}</strong>
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
        {/* Left Column (5 Cols) - Campaign Configuration */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                  Campaign Configuration
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">
                  Sender identity &amp; verified proof showcases
                </p>
              </div>
            </div>

            {/* Sender Name */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Sender Name / Brand Title</span>
              </label>
              <input
                type="text"
                disabled={isDispatching}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Alex // AI Localization Lead"
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Proof Links */}
            <div className="space-y-3 pt-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Work Proof Links (Dynamic HTML Injection)</span>
              </span>

              {/* Dubbing Sample Link */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  AI Dub Sample Link (Drive / Cloud / Video)
                </label>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.dubbing}
                  onChange={(e) => setProofLinks({ ...proofLinks, dubbing: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Thumbnail / Design Link */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  Thumbnail / Design Link (Behance / Drive / Portfolio)
                </label>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.design}
                  onChange={(e) => setProofLinks({ ...proofLinks, design: e.target.value })}
                  placeholder="https://behance.net/..."
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Bot / Web Dev Link */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">
                  Bot / Web Dev Link (GitHub / Live URL)
                </label>
                <input
                  type="url"
                  disabled={isDispatching}
                  value={proofLinks.dev}
                  onChange={(e) => setProofLinks({ ...proofLinks, dev: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            {/* Optional Custom Note */}
            <div className="pt-2">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Optional Custom Note (Highlighted in Email)</span>
              </label>
              <textarea
                rows={3}
                disabled={isDispatching}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Specifically loved your recent 40-minute documentary edit!"
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 transition resize-none"
              />
            </div>
          </div>

          {/* Anti-Spam Safety Advice Panel */}
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-4 border border-emerald-950/60 shadow-xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono space-y-1">
              <div className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <span>Anti-Spam Throttling Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Every dispatch sequence enforces a mandatory <strong>20–30 second cooldown</strong> between emails to simulate authentic human behavior and safeguard your Gmail sender score.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols) - Leads & Live Execution */}
        <div className="lg:col-span-7 space-y-5 flex flex-col">
          {/* Leads Matrix & Action Panel */}
          <div className="bg-[#0f1623]/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                    Target Leads Matrix
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Format: <code className="text-cyan-400 font-semibold">CreatorName, ChannelName, Email</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDispatching}
                onClick={() => setRawLeadsText(DEFAULT_CSV_SAMPLE)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline disabled:opacity-50"
              >
                Reset Sample Leads
              </button>
            </div>

            {/* Bulk Leads CSV Text Area */}
            <div>
              <textarea
                rows={5}
                disabled={isDispatching}
                value={rawLeadsText}
                onChange={(e) => setRawLeadsText(e.target.value)}
                placeholder="Linus, Linus Tech Tips, linus@lmgstudios.com&#10;Mark, Mark Rober, mark@crunchlabs.com"
                className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
              <div className="flex justify-between items-center mt-1.5 text-[11px] font-mono text-slate-500">
                <span>Separate each creator with a new line</span>
                <span className="text-cyan-400 font-semibold">{activeLeadsCount} valid target(s) ready</span>
              </div>
            </div>

            {/* Launch Action Controls */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Cooldown / Status Pill */}
              <div className="w-full sm:w-auto">
                {cooldownSeconds !== null && cooldownSeconds > 0 ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-800/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>Anti-Spam Cooling: <strong>{cooldownSeconds}s</strong> remaining...</span>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Nodemailer SMTP Transporter Ready</span>
                  </div>
                )}
              </div>

              {/* Start / Abort Campaign Button */}
              <div className="w-full sm:w-auto flex justify-end">
                {isDispatching ? (
                  <button
                    onClick={handleAbort}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-rose-950/50"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-300" />
                    <span>Halt Sequence</span>
                  </button>
                ) : (
                  <button
                    disabled={activeLeadsCount === 0}
                    onClick={handleStartCampaign}
                    className="relative group overflow-hidden flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] transition shadow-2xl disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>START PERSONALIZED CAMPAIGN</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Progress Indicator */}
            {(isDispatching || progress.current > 0) && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    Dispatched: <strong className="text-cyan-400">{progress.current}</strong> / {progress.total}
                  </span>
                  <span className="text-emerald-400 font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-[#0a0d14] rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Execution Log Terminal */}
          <div className="bg-[#070a0f] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[360px]">
            {/* Terminal Title Bar */}
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

            {/* Stream Logs */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-2 bg-[#05070a] relative max-h-[380px]">
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
