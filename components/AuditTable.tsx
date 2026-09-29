'use client';

import React from 'react';
import { CreatorLead, LeadStatus } from '@/types/outreach';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Mail,
} from 'lucide-react';

interface AuditTableProps {
  leads: CreatorLead[];
  onRemoveLead: (id: string) => void;
  onRetryLead: (id: string) => void;
  onSelectLeadForPreview: (lead: CreatorLead) => void;
  isDispatching: boolean;
}

export default function AuditTable({
  leads,
  onRemoveLead,
  onRetryLead,
  onSelectLeadForPreview,
  isDispatching,
}: AuditTableProps) {
  const getStatusBadge = (status: LeadStatus, durationMs?: number, errorMessage?: string) => {
    switch (status) {
      case 'delivered':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered {durationMs ? `(${durationMs}ms)` : ''}</span>
          </div>
        );
      case 'sending':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Sending SMTP...</span>
          </div>
        );
      case 'failed':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-rose-950/60 border border-rose-800/60 text-rose-300"
            title={errorMessage || 'Dispatch failed'}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Failed</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Pending Queue</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Table Title Bar */}
      <div className="bg-[#0D131F] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            Audit Ledger // Real-Time Dispatch Status
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {leads.length} Target{leads.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#090D15] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800/80">
            <tr>
              <th className="px-4 py-3">Channel / Creator</th>
              <th className="px-4 py-3">Target Email</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Timestamp / Metrics</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-[#070A0F]">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <Mail className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                  <span>No creator leads active in the matrix. Add one above or import in bulk.</span>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-800/20 transition ${
                    lead.status === 'sending' ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  {/* Channel Name */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-100">{lead.channelName}</div>
                    <div className="text-[11px] text-slate-400">{lead.creatorName}</div>
                  </td>

                  {/* Target Email */}
                  <td className="px-4 py-3 text-cyan-400 select-all font-mono">
                    {lead.email}
                  </td>

                  {/* Niche */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300">
                      {lead.niche}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(lead.status, lead.durationMs, lead.errorMessage)}
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {lead.sentAt ? (
                      <div>
                        <div>{new Date(lead.sentAt).toLocaleTimeString()}</div>
                        {lead.messageId && (
                          <div className="text-[9px] text-slate-500 truncate max-w-[120px]" title={lead.messageId}>
                            id: {lead.messageId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectLeadForPreview(lead)}
                        className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                        title="Preview personalized pitch for this creator"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {lead.status === 'failed' && (
                        <button
                          disabled={isDispatching}
                          onClick={() => onRetryLead(lead.id)}
                          className="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition disabled:opacity-40"
                          title="Reset to Pending"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        disabled={isDispatching}
                        onClick={() => onRemoveLead(lead.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-40"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
