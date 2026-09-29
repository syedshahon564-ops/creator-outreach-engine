'use client';

import React, { useState } from 'react';
import { CreatorLead } from '@/types/outreach';
import { X, Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newLeads: CreatorLead[]) => void;
}

const SAMPLE_CSV = `MrBeast Staff, MrBeast, outreach-test@mrbeast.com, Entertainment & Challenge
Linus, Linus Tech Tips, linus-test@linusmediagroup.com, Tech & Hardware
Mark, Mark Rober, mark-test@crunchlabs.com, Engineering & Science
Shroud, Shroud, shroud-test@loaded.gg, FPS Gaming & Esports
ColdFusion, ColdFusion TV, dagogo-test@coldfusion.com, Tech Documentary`;

export default function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [inputText, setInputText] = useState(SAMPLE_CSV);
  const [parsedLeads, setParsedLeads] = useState<CreatorLead[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = (raw: string) => {
    setInputText(raw);
    setParseError(null);

    const trimmed = raw.trim();
    if (!trimmed) {
      setParsedLeads([]);
      return;
    }

    try {
      // Attempt JSON parse first
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          const list: CreatorLead[] = json.map((item, idx) => ({
            id: `lead-import-${Date.now()}-${idx}`,
            creatorName: item.creatorName || item.creator || 'Creator',
            channelName: item.channelName || item.channel || 'Channel',
            email: item.email || '',
            niche: item.niche || 'General',
            status: 'pending' as const,
          })).filter((l) => l.email.includes('@'));
          setParsedLeads(list);
          return;
        }
      }

      // Parse CSV / Line-by-line
      const lines = trimmed.split('\n');
      const leads: CreatorLead[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        // Skip CSV header if user pasted it
        if (i === 0 && line.toLowerCase().includes('email') && line.toLowerCase().includes('channel')) {
          continue;
        }

        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const creatorName = parts[0];
          const channelName = parts[1];
          const email = parts[2];
          const niche = parts[3] || 'YouTube Creator';

          if (email && email.includes('@')) {
            leads.push({
              id: `lead-import-${Date.now()}-${i}`,
              creatorName,
              channelName,
              email,
              niche,
              status: 'pending' as const,
            });
          }
        }
      }

      setParsedLeads(leads);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse leads data.');
      setParsedLeads([]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedLeads.length > 0) {
      onImport(parsedLeads);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0B0F17] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0E1522]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-slate-100">
                Bulk Leads Import Matrix
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Paste CSV lines (Creator, Channel, Email, Niche) or JSON array
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Format: <code className="text-cyan-400 font-semibold">Creator Name, Channel Name, Email, Niche</code>
            </span>
            <button
              onClick={() => handleParse(SAMPLE_CSV)}
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              Reset to Sample Data
            </button>
          </div>

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="MrBeast, MrBeast, beast@mrbeast.com, Entertainment&#10;Linus, Linus Tech Tips, linus@lmg.gg, Tech"
            className="w-full bg-[#070A0F] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-600 transition"
          />

          {parseError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedLeads.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid Targets Detected: {parsedLeads.length}</span>
                </span>
                <span className="text-slate-500">Ready to enqueue</span>
              </div>

              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800/80 bg-[#070A0F]">
                <table className="w-full text-[11px] font-mono text-left">
                  <thead className="bg-slate-900/80 text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Creator</th>
                      <th className="px-3 py-1.5">Channel</th>
                      <th className="px-3 py-1.5">Email</th>
                      <th className="px-3 py-1.5">Niche</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedLeads.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="px-3 py-1">{l.creatorName}</td>
                        <td className="px-3 py-1 text-cyan-400">{l.channelName}</td>
                        <td className="px-3 py-1 text-slate-400">{l.email}</td>
                        <td className="px-3 py-1">{l.niche}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0E1522] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            disabled={parsedLeads.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            Import {parsedLeads.length} Creators
          </button>
        </div>
      </div>
    </div>
  );
}
