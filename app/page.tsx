'use client';

import React, { useState, useRef, useEffect } from 'react';
import HeaderPanel from '@/components/HeaderPanel';
import CampaignConfig from '@/components/CampaignConfig';
import LiveEmailPreview from '@/components/LiveEmailPreview';
import LeadsManager from '@/components/LeadsManager';
import LaunchControls from '@/components/LaunchControls';
import AuditTable from '@/components/AuditTable';
import DispatchTerminal from '@/components/DispatchTerminal';
import BulkImportModal from '@/components/BulkImportModal';
import { CreatorLead, OutreachConfig, DispatchLog, StreamEventPayload } from '@/types/outreach';

const DEFAULT_SAMPLE_LEADS: CreatorLead[] = [
  {
    id: 'lead-1',
    creatorName: 'Linus',
    channelName: 'Linus Tech Tips',
    email: 'linus.sample@lmgstudios.com',
    niche: 'Tech & Hardware',
    status: 'pending',
  },
  {
    id: 'lead-2',
    creatorName: 'Mark',
    channelName: 'Mark Rober',
    email: 'mark.sample@crunchlabs.com',
    niche: 'Engineering & Science',
    status: 'pending',
  },
  {
    id: 'lead-3',
    creatorName: 'Michael',
    channelName: 'Vsauce',
    email: 'michael.sample@vsauce.com',
    niche: 'Education & Philosophy',
    status: 'pending',
  },
  {
    id: 'lead-4',
    creatorName: 'Shroud',
    channelName: 'Shroud',
    email: 'shroud.sample@loaded.gg',
    niche: 'Gaming & Esports',
    status: 'pending',
  },
  {
    id: 'lead-5',
    creatorName: 'Dagogo',
    channelName: 'ColdFusion TV',
    email: 'dagogo.sample@coldfusionmedia.com',
    niche: 'Video Essay & AI Tech',
    status: 'pending',
  },
];

export default function MissionControlPage() {
  // Campaign Configuration
  const [config, setConfig] = useState<OutreachConfig>({
    senderName: 'Alex // Localization & AI Dev Lead',
    senderEmail: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',
    smtpPass: '',
    portfolioUrl: 'https://drive.google.com/drive/folders/sample-dubbing-showcase',
    reviewUrl: 'https://bengali-dub-hub.vercel.app/reviews',
    delaySeconds: 25,
  });

  // SMTP Status state
  const [smtpStatus, setSmtpStatus] = useState<'unknown' | 'testing' | 'connected' | 'error'>('unknown');
  const [smtpLatency, setSmtpLatency] = useState<number | undefined>(undefined);
  const [smtpError, setSmtpError] = useState<string | undefined>(undefined);

  // Leads & Execution state
  const [leads, setLeads] = useState<CreatorLead[]>(DEFAULT_SAMPLE_LEADS);
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentChannelSending, setCurrentChannelSending] = useState<string | undefined>(undefined);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | undefined>(undefined);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Real-time Logs
  const [logs, setLogs] = useState<DispatchLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: '[MISSION ENGINE] System initialized. Ready to launch cold outreach campaign.',
    },
  ]);

  // Tab switcher for right column lower pane: "Audit Ledger" vs "Live Terminal" vs "Split View"
  const [viewTab, setViewTab] = useState<'both' | 'table' | 'terminal'>('both');

  // Abort controller reference for ongoing campaign
  const abortControllerRef = useRef<AbortController | null>(null);

  // Daily counter (tracked in local storage or session)
  const [dailySentCount, setDailySentCount] = useState<number>(0);

  // Derived statistics
  const totalQueue = leads.filter((l) => l.status === 'pending').length;
  const totalSent = leads.filter((l) => l.status === 'delivered').length;
  const totalFailed = leads.filter((l) => l.status === 'failed').length;
  const completedLeads = totalSent + totalFailed;

  // Add log entry helper
  const addLog = (level: DispatchLog['level'], message: string, channelName?: string, email?: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        level,
        message,
        channelName,
        email,
      },
    ]);
  };

  // Test SMTP connection live
  const handleTestSmtp = async () => {
    if (!config.smtpPass || !config.smtpUser) {
      setSmtpStatus('error');
      setSmtpError('Please enter Sender Email & Gmail App Password first.');
      addLog('warn', '[SMTP ERROR] Test aborted: Sender Email or Gmail App Password is missing.');
      return;
    }

    setSmtpStatus('testing');
    addLog('info', `[SMTP HANDSHAKE] Connecting to ${config.smtpHost}:${config.smtpPort} using user ${config.smtpUser}...`);

    try {
      const res = await fetch('/api/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSmtpStatus('connected');
        setSmtpLatency(data.latencyMs);
        setSmtpError(undefined);
        addLog('success', `[SMTP ONLINE] Handshake successful (${data.latencyMs}ms). Ready for high-volume inboxing.`);
      } else {
        setSmtpStatus('error');
        setSmtpError(data.error || 'Authentication failed');
        addLog('error', `[SMTP FAILED] ${data.error || 'Failed to authenticate with SMTP server'}`);
      }
    } catch (err: any) {
      setSmtpStatus('error');
      setSmtpError(err?.message || 'Network error');
      addLog('error', `[SMTP ERROR] Network error contacting verification endpoint: ${err.message}`);
    }
  };

  // Auto-fill smtpUser when senderEmail changes
  const handleConfigChange = (newConfig: OutreachConfig) => {
    if (newConfig.senderEmail && !newConfig.smtpUser) {
      newConfig.smtpUser = newConfig.senderEmail;
    }
    setConfig(newConfig);
  };

  // Start campaign dispatch via Server-Sent Events
  const handleStartCampaign = async () => {
    const pendingLeads = leads.filter((l) => l.status === 'pending');

    if (pendingLeads.length === 0) {
      addLog('warn', '[WARN] No pending leads in queue. Add more creators or reset failed items.');
      return;
    }

    if (!config.smtpPass || !config.smtpUser) {
      alert('Please fill in your Sender Email and 16-character Gmail App Password in the Campaign Configuration panel before initiating dispatch.');
      return;
    }

    setIsDispatching(true);
    setCooldownSeconds(undefined);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    addLog('info', `[DISPATCH SEQUENCE STARTED] Initiating batch outreach to ${pendingLeads.length} creators...`);

    try {
      const response = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: pendingLeads,
          config,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server-Sent Events connection failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported on this browser/environment');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep partial line

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/);
          if (match) {
            try {
              const event: StreamEventPayload = JSON.parse(match[1]);
              handleStreamEvent(event);
            } catch (err) {
              console.error('Failed to parse SSE event:', line, err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog('warn', '[CAMPAIGN HALTED] Operation aborted by user.');
      } else {
        addLog('error', `[DISPATCH ENGINE ERROR] ${err.message}`);
      }
    } finally {
      setIsDispatching(false);
      setCurrentChannelSending(undefined);
      setCooldownSeconds(undefined);
      abortControllerRef.current = null;
    }
  };

  // Handle incoming stream telemetry
  const handleStreamEvent = (event: StreamEventPayload) => {
    switch (event.type) {
      case 'start':
        addLog('info', event.message);
        break;

      case 'sending':
        setCurrentChannelSending(event.channelName);
        setCooldownSeconds(undefined);
        if (event.leadId) {
          setLeads((prev) =>
            prev.map((l) => (l.id === event.leadId ? { ...l, status: 'sending' } : l))
          );
        }
        addLog('info', event.message, event.channelName, event.email);
        break;

      case 'delivered':
        setCurrentChannelSending(undefined);
        if (event.leadId) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === event.leadId
                ? {
                    ...l,
                    status: 'delivered',
                    sentAt: event.timestamp,
                    durationMs: event.durationMs,
                    messageId: event.messageId,
                  }
                : l
            )
          );
        }
        setDailySentCount((prev) => prev + 1);
        addLog('success', event.message, event.channelName, event.email);
        break;

      case 'failed':
        setCurrentChannelSending(undefined);
        if (event.leadId) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === event.leadId
                ? {
                    ...l,
                    status: 'failed',
                    errorMessage: event.errorMessage,
                  }
                : l
            )
          );
        }
        addLog('error', event.message, event.channelName, event.email);
        break;

      case 'countdown':
        setCooldownSeconds(event.remainingSeconds);
        // Only log milestone seconds to avoid overwhelming terminal
        if (event.remainingSeconds && (event.remainingSeconds % 5 === 0 || event.remainingSeconds <= 3)) {
          addLog('warn', event.message);
        }
        break;

      case 'completed':
        setCurrentChannelSending(undefined);
        setCooldownSeconds(undefined);
        addLog('success', event.message);
        break;

      case 'error':
        addLog('error', event.message);
        break;
    }
  };

  // Abort ongoing campaign
  const handleAbortCampaign = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('warn', '[INTERRUPT] Aborting campaign dispatch...');
    }
  };

  // Lead Matrix Operations
  const handleAddLead = (lead: CreatorLead) => {
    setLeads((prev) => [lead, ...prev]);
    addLog('info', `[QUEUE] Enqueued creator: ${lead.channelName} (${lead.email})`);
  };

  const handleBulkImport = (newLeads: CreatorLead[]) => {
    setLeads((prev) => [...newLeads, ...prev]);
    addLog('info', `[BULK IMPORT] Enqueued ${newLeads.length} new creator leads.`);
  };

  const handleRemoveLead = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (lead) {
      addLog('info', `[QUEUE REMOVED] Removed ${lead.channelName} from queue.`);
    }
  };

  const handleRetryLead = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'pending', errorMessage: undefined } : l))
    );
    addLog('info', `[QUEUE RE-ENQUEUED] Lead reset to pending.`);
  };

  const handleClearLeads = () => {
    if (confirm('Clear all leads from the matrix?')) {
      setLeads([]);
      addLog('info', '[QUEUE PURGED] Lead matrix cleared.');
    }
  };

  const handleLoadSampleLeads = () => {
    setLeads(DEFAULT_SAMPLE_LEADS);
    addLog('info', `[PRESETS LOADED] Primed 5 high-value YouTube creators into queue.`);
  };

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto flex flex-col">
      {/* Header Panel */}
      <HeaderPanel
        smtpStatus={smtpStatus}
        smtpLatency={smtpLatency}
        smtpError={smtpError}
        totalQueue={totalQueue}
        totalSent={totalSent}
        totalFailed={totalFailed}
        dailySentCount={dailySentCount}
        onTestSmtp={handleTestSmtp}
      />

      {/* Main 2-Column Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column (5 Cols) - Campaign Configuration & Live Pitch Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Credentials & Settings */}
          <CampaignConfig
            config={config}
            onChange={handleConfigChange}
            isDispatching={isDispatching}
          />

          {/* Realistic Live Pitch Email Preview */}
          <LiveEmailPreview leads={leads} config={config} />
        </div>

        {/* Right Column (7 Cols) - Target Leads Matrix & Operations */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          {/* Leads Matrix Input & Presets */}
          <LeadsManager
            leads={leads}
            onAddLead={handleAddLead}
            onClearLeads={handleClearLeads}
            onOpenBulkImport={() => setIsBulkModalOpen(true)}
            onLoadSampleLeads={handleLoadSampleLeads}
            isDispatching={isDispatching}
          />

          {/* Operation Launch / Progress Bar */}
          <LaunchControls
            isDispatching={isDispatching}
            canLaunch={totalQueue > 0 && !isDispatching}
            totalLeads={leads.length}
            completedLeads={completedLeads}
            cooldownSeconds={cooldownSeconds}
            currentChannelSending={currentChannelSending}
            onStartCampaign={handleStartCampaign}
            onAbortCampaign={handleAbortCampaign}
          />

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Operations Telemetry &amp; Ledger
            </span>

            <div className="flex bg-[#070A0F] rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setViewTab('both')}
                className={`px-3 py-1 rounded transition ${
                  viewTab === 'both'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewTab('table')}
                className={`px-3 py-1 rounded transition ${
                  viewTab === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ledger Table
              </button>
              <button
                onClick={() => setViewTab('terminal')}
                className={`px-3 py-1 rounded transition ${
                  viewTab === 'terminal'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Telemetry Terminal
              </button>
            </div>
          </div>

          {/* Real-Time Dispatch Terminal / Audit Table */}
          <div className="space-y-5 flex-1 flex flex-col">
            {(viewTab === 'both' || viewTab === 'table') && (
              <AuditTable
                leads={leads}
                onRemoveLead={handleRemoveLead}
                onRetryLead={handleRetryLead}
                onSelectLeadForPreview={(lead) => {
                  // Switch preview lead
                  const previewSelect = document.querySelector('select');
                  if (previewSelect) {
                    previewSelect.value = lead.id;
                    previewSelect.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
                isDispatching={isDispatching}
              />
            )}

            {(viewTab === 'both' || viewTab === 'terminal') && (
              <div className={viewTab === 'both' ? 'flex-1' : 'h-[500px]'}>
                <DispatchTerminal
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                  isDispatching={isDispatching}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk CSV / JSON Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
      />
    </main>
  );
}
