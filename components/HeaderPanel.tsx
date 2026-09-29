'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Send, XCircle, Clock, Zap } from 'lucide-react';

interface HeaderPanelProps {
  smtpStatus: 'unknown' | 'testing' | 'connected' | 'error';
  smtpLatency?: number;
  smtpError?: string;
  totalQueue: number;
  totalSent: number;
  totalFailed: number;
  dailySentCount: number;
  maxDailyLimit?: number;
  onTestSmtp: () => void;
}

export default function HeaderPanel({
  smtpStatus,
  smtpLatency,
  smtpError,
  totalQueue,
  totalSent,
  totalFailed,
  dailySentCount,
  maxDailyLimit = 500,
  onTestSmtp,
}: HeaderPanelProps) {
  const dailyRemaining = Math.max(0, maxDailyLimit - dailySentCount);
  const dailyPercentage = Math.min(100, Math.round((dailySentCount / maxDailyLimit) * 100));

  return (
    <header className="w-full glass-panel rounded-xl p-5 mb-6 border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background ambient cyberpunk light */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-0 left-1/3 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        {/* Title and Branding */}
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              TACTICAL AGENTIC PIPELINE
            </div>
            <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              250M+ BENGALI REACH
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300">
              CREATOR OUTREACH ENGINE
            </span>
            <span className="text-slate-600 font-mono text-xl font-light">//</span>
            <span className="text-slate-400 text-lg md:text-xl font-medium tracking-wide">
              AI DUB &amp; DEV SUITE
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
            Autonomous cold pitch automation dispatching neural English-to-Bengali dubbing offers &amp; tech value-adds to top-tier creators.
          </p>
        </div>

        {/* Right side: SMTP Badge & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SMTP Status Badge */}
          <div
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border text-xs font-mono transition-all ${
              smtpStatus === 'connected'
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : smtpStatus === 'testing'
                ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300'
                : smtpStatus === 'error'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            {smtpStatus === 'connected' && (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SMTP ONLINE ({smtpLatency ?? 0}ms)</span>
              </>
            )}

            {smtpStatus === 'testing' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>HANDSHAKING SMTP...</span>
              </>
            )}

            {smtpStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span title={smtpError || 'Failed to authenticate SMTP'}>
                  SMTP OFFLINE
                </span>
              </>
            )}

            {smtpStatus === 'unknown' && (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>SMTP NOT TESTED</span>
              </>
            )}

            <button
              onClick={onTestSmtp}
              disabled={smtpStatus === 'testing'}
              className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Test connection to SMTP server"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
        {/* Total In Queue */}
        <div className="bg-[#0B0F17]/80 rounded-lg p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Queue Total</div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{totalQueue}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Successfully Sent */}
        <div className="bg-[#0B0F17]/80 rounded-lg p-3 border border-emerald-900/40 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-emerald-400/90 uppercase tracking-wider">Delivered</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{totalSent}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-800/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <Send className="w-4 h-4" />
          </div>
        </div>

        {/* Failed */}
        <div className="bg-[#0B0F17]/80 rounded-lg p-3 border border-rose-900/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-rose-400/90 uppercase tracking-wider">Failed</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{totalFailed}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-950/50 flex items-center justify-center text-rose-400 border border-rose-800/40">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Daily Gmail Limit counter */}
        <div className="bg-[#0B0F17]/80 rounded-lg p-3 border border-cyan-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Daily Gmail Quota</span>
            <span className="text-[11px] font-mono text-slate-400">{dailySentCount} / {maxDailyLimit}</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${dailyPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-slate-500">
              <span>{dailyRemaining} remaining</span>
              <span>{dailyPercentage}% utilized</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
