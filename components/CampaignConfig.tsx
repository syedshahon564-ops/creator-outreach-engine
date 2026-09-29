'use client';

import React, { useState } from 'react';
import { OutreachConfig } from '@/types/outreach';
import {
  Key,
  Mail,
  User,
  ExternalLink,
  Shield,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  HelpCircle,
  FolderArchive,
  Star,
} from 'lucide-react';

interface CampaignConfigProps {
  config: OutreachConfig;
  onChange: (newConfig: OutreachConfig) => void;
  isDispatching: boolean;
}

export default function CampaignConfig({
  config,
  onChange,
  isDispatching,
}: CampaignConfigProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleFieldChange = (field: keyof OutreachConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              Campaign Configuration
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              SMTP Credentials &amp; Pitch Assets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelpModal(!showHelpModal)}
          className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition"
          title="Gmail App Password Guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Gmail Setup?</span>
        </button>
      </div>

      {/* Gmail App Password Info Card (Expandable) */}
      {showHelpModal && (
        <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 space-y-2 font-mono">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span>How to generate a Gmail 16-character App Password:</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400">
            <li>Go to your Google Account &gt; Security &gt; 2-Step Verification.</li>
            <li>Scroll to the bottom to <strong>App Passwords</strong>.</li>
            <li>Create one named "Creator Outreach" and copy the 16 letters (e.g. <code>abcd efgh ijkl mnop</code>).</li>
            <li>Paste it below. No regular Google passwords will work with SMTP.</li>
          </ol>
        </div>
      )}

      {/* Section 1: Sender & Authentication */}
      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Sender Name</span>
          </label>
          <input
            type="text"
            disabled={isDispatching}
            value={config.senderName}
            onChange={(e) => handleFieldChange('senderName', e.target.value)}
            placeholder="e.g. Alex // Creator Localization Lead"
            className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Sender Email (Gmail / Workspace)</span>
          </label>
          <input
            type="email"
            disabled={isDispatching}
            value={config.senderEmail}
            onChange={(e) => {
              handleFieldChange('senderEmail', e.target.value);
              if (!config.smtpUser) {
                handleFieldChange('smtpUser', e.target.value);
              }
            }}
            placeholder="creator.outreach@gmail.com"
            className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Gmail 16-Char App Password</span>
            </span>
            <span className="text-[10px] text-emerald-400 lowercase">smtp ready</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={isDispatching}
              value={config.smtpPass}
              onChange={(e) => handleFieldChange('smtpPass', e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-3 py-2 pr-9 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono tracking-wider transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced SMTP Details Accordion */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
          className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-slate-300 transition py-1"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Advanced SMTP Relay Settings</span>
          </span>
          {showAdvancedSmtp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvancedSmtp && (
          <div className="mt-2.5 p-3 rounded-lg bg-[#070A0F]/60 border border-slate-800 space-y-2.5 font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">Host</label>
                <input
                  type="text"
                  disabled={isDispatching}
                  value={config.smtpHost}
                  onChange={(e) => handleFieldChange('smtpHost', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-slate-500 mb-1">Port</label>
                <input
                  type="number"
                  disabled={isDispatching}
                  value={config.smtpPort}
                  onChange={(e) => handleFieldChange('smtpPort', Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="smtpSecure"
                disabled={isDispatching}
                checked={config.smtpSecure}
                onChange={(e) => handleFieldChange('smtpSecure', e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="smtpSecure" className="text-[11px] text-slate-400 cursor-pointer">
                SSL / TLS Encrypted (Recommended for port 465)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Portfolio & Review Links */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dynamic Pitch Links</span>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
            <span>Dubbing Showcase URL (Drive / Box / Cloud)</span>
          </label>
          <input
            type="url"
            disabled={isDispatching}
            value={config.portfolioUrl}
            onChange={(e) => handleFieldChange('portfolioUrl', e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-slate-500" />
            <span>Reviews &amp; Case Studies URL</span>
          </label>
          <input
            type="url"
            disabled={isDispatching}
            value={config.reviewUrl}
            onChange={(e) => handleFieldChange('reviewUrl', e.target.value)}
            placeholder="https://yourportfolio.com/reviews"
            className="w-full bg-[#070A0F] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>
      </div>

      {/* Section 3: Safety & Anti-Spam Throttle */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Spam Throttle Delay</span>
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            {config.delaySeconds}s interval
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="60"
          step="5"
          disabled={isDispatching}
          value={config.delaySeconds}
          onChange={(e) => handleFieldChange('delaySeconds', Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Fast (5s - Demo only)</span>
          <span className="text-emerald-400 font-semibold">Recommended (25s - Safe Inboxing)</span>
          <span>Ultra-Safe (60s)</span>
        </div>

        <p className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
          💡 <strong className="text-slate-300">Spam Defense:</strong> Gmail rate-limiting detects rapid bulk dispatches. Pacing each send by 20–40 seconds maintains a genuine human sender reputation.
        </p>
      </div>
    </div>
  );
}
