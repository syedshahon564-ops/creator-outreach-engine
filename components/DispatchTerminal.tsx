'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DispatchLog } from '@/types/outreach';
import { Terminal, Copy, Trash2, ArrowDown, Check } from 'lucide-react';

interface DispatchTerminalProps {
  logs: DispatchLog[];
  onClearLogs: () => void;
  isDispatching: boolean;
}

export default function DispatchTerminal({ logs, onClearLogs, isDispatching }: DispatchTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const raw = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogColor = (message: string, level: string) => {
    if (message.includes('[DISPATCHED]')) return 'text-emerald-400 font-semibold';
    if (message.includes('[FAILED]')) return 'text-rose-400 font-semibold';
    if (message.includes('[SENDING]')) return 'text-cyan-400';
    if (message.includes('[ANTI-SPAM THROTTLE]')) return 'text-amber-400';
    if (message.includes('[MISSION ENGINE]')) return 'text-purple-400';
    if (message.includes('[COMPLETED]')) return 'text-emerald-300 font-bold';

    switch (level) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-rose-400';
      case 'warn':
        return 'text-amber-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="glass-terminal rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[320px]">
      {/* Terminal Title Bar */}
      <div className="bg-[#0B0F17] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Cyberpunk dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 inline-block shadow-[0_0_8px_rgba(0,240,255,0.6)]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
          </div>

          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
              DISPATCH TERMINAL // LIVE TELEMETRY
            </span>
          </div>

          {isDispatching && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              STREAMING
            </span>
          )}
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 transition ${
              autoScroll
                ? 'bg-slate-800 text-cyan-400 border border-cyan-800/50'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
            title="Auto-scroll terminal to bottom"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Auto-Scroll</span>
          </button>

          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition disabled:opacity-40"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1 rounded-md bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition disabled:opacity-40"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-1.5 bg-[#05070B] relative">
        {/* Subtle scanline line */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

        {logs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
            <Terminal className="w-8 h-8 text-slate-700" />
            <span className="text-xs">No dispatch activity recorded. Initiate campaign to stream logs.</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 group leading-relaxed">
              <span className="text-slate-600 select-none text-[11px] shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-700 select-none">&gt;</span>
              <span className={`break-all ${getLogColor(log.message, log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
