'use client';

import React from 'react';
import { Play, Square, Loader2, ShieldCheck, Flame, Radio, AlertCircle } from 'lucide-react';

interface LaunchControlsProps {
  isDispatching: boolean;
  canLaunch: boolean;
  totalLeads: number;
  completedLeads: number;
  cooldownSeconds?: number;
  currentChannelSending?: string;
  onStartCampaign: () => void;
  onAbortCampaign: () => void;
}

export default function LaunchControls({
  isDispatching,
  canLaunch,
  totalLeads,
  completedLeads,
  cooldownSeconds,
  currentChannelSending,
  onStartCampaign,
  onAbortCampaign,
}: LaunchControlsProps) {
  const percentage = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Side: Status / Cooldown info */}
        <div className="w-full sm:w-auto">
          {isDispatching ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  DISPATCH ENGINE LIVE
                </span>
              </div>

              {currentChannelSending && (
                <div className="text-xs font-mono text-slate-300">
                  Connecting to SMTP for <span className="text-emerald-400 font-semibold">{currentChannelSending}</span>
                </div>
              )}

              {cooldownSeconds !== undefined && cooldownSeconds > 0 && (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Anti-Spam Delay Active: Cooling for <strong>{cooldownSeconds}s</strong>...</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-500" />
                <span>Campaign Operations Hub</span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                {totalLeads === 0
                  ? 'Queue is empty. Add or import creator leads to begin.'
                  : `${totalLeads} creator lead${totalLeads > 1 ? 's' : ''} primed in queue for localized outreach.`}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Launch / Abort Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isDispatching ? (
            <button
              onClick={onAbortCampaign}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-950/50 transition"
            >
              <Square className="w-4 h-4 fill-rose-300" />
              <span>Halt Campaign</span>
            </button>
          ) : (
            <button
              disabled={!canLaunch}
              onClick={onStartCampaign}
              className={`relative group overflow-hidden flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest transition shadow-2xl ${
                canLaunch
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {/* Subtle animated light sweep across button when ready */}
              {canLaunch && (
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              )}
              <Play className="w-4 h-4 fill-current" />
              <span>INITIATE CAMPAIGN DISPATCH</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Visible during dispatch or after completion) */}
      {(isDispatching || completedLeads > 0) && totalLeads > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>
              Dispatch Progress: <strong className="text-cyan-400">{completedLeads}</strong> / {totalLeads} dispatched
            </span>
            <span className="text-emerald-400 font-bold">{percentage}%</span>
          </div>
          <div className="w-full bg-[#070A0F] rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-300 relative"
              style={{ width: `${percentage}%` }}
            >
              {isDispatching && (
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/80 animate-ping rounded-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
