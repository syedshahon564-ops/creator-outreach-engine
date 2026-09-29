'use client';

import React, { useState } from 'react';
import { CreatorLead } from '@/types/outreach';
import { UserPlus, Upload, Trash2, Sparkles, Plus, ListFilter } from 'lucide-react';

interface LeadsManagerProps {
  leads: CreatorLead[];
  onAddLead: (lead: CreatorLead) => void;
  onClearLeads: () => void;
  onOpenBulkImport: () => void;
  onLoadSampleLeads: () => void;
  isDispatching: boolean;
}

const COMMON_NICHES = [
  'Tech & Hardware',
  'Gaming & Esports',
  'Video Essay',
  'Coding & Dev',
  'Science / Education',
  'Finance & Business',
];

export default function LeadsManager({
  leads,
  onAddLead,
  onClearLeads,
  onOpenBulkImport,
  onLoadSampleLeads,
  isDispatching,
}: LeadsManagerProps) {
  const [creatorName, setCreatorName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [email, setEmail] = useState('');
  const [niche, setNiche] = useState('Tech & Hardware');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim() || !channelName.trim() || !email.trim()) return;

    const newLead: CreatorLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      creatorName: creatorName.trim(),
      channelName: channelName.trim(),
      email: email.trim(),
      niche: niche.trim() || 'General Creator',
      status: 'pending',
    };

    onAddLead(newLead);
    setCreatorName('');
    setChannelName('');
    setEmail('');
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              Target Leads Matrix
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Enqueue High-Value YouTube Creators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDispatching}
            onClick={onLoadSampleLeads}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/60 text-xs font-mono transition disabled:opacity-50"
            title="Load 5 realistic test targets"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 5 Targets</span>
          </button>

          <button
            type="button"
            disabled={isDispatching}
            onClick={onOpenBulkImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bulk CSV / JSON</span>
          </button>

          {leads.length > 0 && (
            <button
              type="button"
              disabled={isDispatching}
              onClick={onClearLeads}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 transition disabled:opacity-50"
              title="Clear all leads from queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Manual Add Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Creator Name */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Creator Name
            </label>
            <input
              type="text"
              disabled={isDispatching}
              required
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Linus"
              className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Channel Name
            </label>
            <input
              type="text"
              disabled={isDispatching}
              required
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. Linus Tech Tips"
              className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Business Email
            </label>
            <input
              type="email"
              disabled={isDispatching}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="linus@channel.com"
              className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Specific Niche */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Channel Niche
            </label>
            <input
              type="text"
              disabled={isDispatching}
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Tech / Gaming / Science"
              className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Quick Niche Suggestion Chips & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
              <ListFilter className="w-3 h-3" /> Quick Niche:
            </span>
            {COMMON_NICHES.map((n) => (
              <button
                key={n}
                type="button"
                disabled={isDispatching}
                onClick={() => setNiche(n)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  niche === n
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-300 border border-slate-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isDispatching || !creatorName || !channelName || !email}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold shadow-md shadow-emerald-950 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus className="w-4 h-4" />
            <span>Enqueue Creator</span>
          </button>
        </div>
      </form>
    </div>
  );
}
