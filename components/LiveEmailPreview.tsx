'use client';

import React, { useState } from 'react';
import { CreatorLead, OutreachConfig } from '@/types/outreach';
import { generatePitch } from '@/lib/pitchEngine';
import { Mail, Sparkles, Copy, Check, Monitor, FileText, ChevronRight } from 'lucide-react';

interface LiveEmailPreviewProps {
  leads: CreatorLead[];
  config: OutreachConfig;
}

export default function LiveEmailPreview({ leads, config }: LiveEmailPreviewProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || 'mock');
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');
  const [copied, setCopied] = useState(false);

  // If no leads exist, use a rich default target
  const currentLead: CreatorLead = leads.find((l) => l.id === selectedLeadId) || leads[0] || {
    id: 'mock-sample',
    creatorName: 'Mark',
    channelName: 'Mark Rober',
    email: 'mark@crunchlabs.com',
    niche: 'Tech & Engineering',
    status: 'pending',
  };

  const pitch = generatePitch({
    creatorName: currentLead.creatorName,
    channelName: currentLead.channelName,
    niche: currentLead.niche,
    senderName: config.senderName || 'Alex // Localization Specialist',
    senderEmail: config.senderEmail || 'outreach@dubsuite.io',
    portfolioUrl: config.portfolioUrl,
    reviewUrl: config.reviewUrl,
  });

  const handleCopyText = () => {
    navigator.clipboard.writeText(activeTab === 'html' ? pitch.html : pitch.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Top Bar / Header */}
      <div className="bg-[#0D131F] px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* macOS window control buttons */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Outreach Preview Client</span>
          </span>
        </div>

        {/* Lead Selector & Tab switcher */}
        <div className="flex items-center gap-2">
          {leads.length > 1 && (
            <select
              value={currentLead.id}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="bg-[#070A0F] border border-slate-700 rounded text-[11px] font-mono text-slate-300 px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  Target: {l.channelName} ({l.niche})
                </option>
              ))}
            </select>
          )}

          <div className="flex bg-[#070A0F] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition ${
                activeTab === 'html'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition ${
                activeTab === 'text'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Plain-Text</span>
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Copy Pitch Content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Realistic Email Meta Header */}
      <div className="bg-[#0B0F17]/90 px-4 py-3 border-b border-slate-800/80 font-mono text-xs space-y-1.5">
        <div className="flex items-center text-slate-400">
          <span className="w-16 text-slate-500 uppercase text-[10px]">From:</span>
          <span className="text-slate-200 font-medium">
            {config.senderName || 'Alex // Localization Specialist'}{' '}
            <span className="text-slate-500">&lt;{config.senderEmail || 'outreach@dubsuite.io'}&gt;</span>
          </span>
        </div>
        <div className="flex items-center text-slate-400">
          <span className="w-16 text-slate-500 uppercase text-[10px]">To:</span>
          <span className="text-cyan-400 font-medium">
            {currentLead.creatorName}{' '}
            <span className="text-slate-500">&lt;{currentLead.email}&gt;</span>
          </span>
          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
            {currentLead.niche}
          </span>
        </div>
        <div className="flex items-center text-slate-400">
          <span className="w-16 text-slate-500 uppercase text-[10px]">Subject:</span>
          <span className="text-emerald-400 font-medium">{pitch.subject}</span>
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="relative min-h-[360px] max-h-[460px] overflow-y-auto p-4 bg-[#070A0F]">
        {activeTab === 'html' ? (
          <div className="rounded-lg border border-slate-800 bg-[#0B0F17] overflow-hidden shadow-inner">
            <iframe
              srcDoc={pitch.html}
              title="Pitch Email Preview"
              className="w-full h-[400px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-text p-3 bg-[#0B0F17] rounded-lg border border-slate-800/80">
            {pitch.text}
          </pre>
        )}
      </div>

      {/* Footer bar indicator */}
      <div className="bg-[#0D131F] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1 text-cyan-400/90">
          <Sparkles className="w-3 h-3" />
          <span>Dynamic Niche Personalization Active</span>
        </span>
        <span>Target: {currentLead.channelName}</span>
      </div>
    </div>
  );
}
