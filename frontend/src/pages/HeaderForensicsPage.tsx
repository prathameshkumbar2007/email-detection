import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { HeaderTable } from '../components/analysis/HeaderTable';
import { RelayTimeline } from '../components/analysis/RelayTimeline';
import { RiskBadge } from '../components/shared/RiskBadge';
import { Binary, ShieldAlert, Copy, Check, Info, Search } from 'lucide-react';

export const HeaderForensicsPage: React.FC = () => {
  const { activeAnalysis, samples } = useDemo();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [headerSearch, setHeaderSearch] = useState('');

  const displayAnalysis = activeAnalysis;

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rawHeaders = displayAnalysis?.parsed?.raw_headers_list || [];
  const filteredHeaders = rawHeaders.filter(h =>
    h.name.toLowerCase().includes(headerSearch.toLowerCase()) ||
    h.value.toLowerCase().includes(headerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 font-mono flex items-center gap-2">
            <Binary className="h-6 w-6 text-sky-400" />
            Email Header Forensics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            RFC 5322 header reconstruction, chronological SMTP hop latency analysis, and protocol alignment inspection.
          </p>
        </div>
      </div>

      {/* Prominent Limitation Banner */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-300 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Forensic Caution:</strong> Received headers are not inherently trustworthy. Intermediate MTAs can be forged or manipulated by malicious actors. Only the hops validated by your receiving perimeter mail exchange (MX) can be cryptographically verified.
        </div>
      </div>

      {/* Visual Relay Timeline */}
      <RelayTimeline hops={displayAnalysis?.relay_hops || []} />

      {/* Header Summary & Auth Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Core Header Fields */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3 font-mono text-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Core RFC 5322 Header Fields
          </span>
          <div className="space-y-2 text-xs">
            {[
              { label: 'From', val: displayAnalysis?.parsed?.from?.raw || 'marcus.vance@vance-holdings.com' },
              { label: 'To', val: displayAnalysis?.parsed?.to || 'sjenkins@vance-holdings.com' },
              { label: 'Subject', val: displayAnalysis?.parsed?.subject || 'Priority Wire Transfer' },
              { label: 'Date', val: displayAnalysis?.parsed?.date || 'Mon, 07 Sep 2026 13:19:30 +0000' },
              { label: 'Message-ID', val: displayAnalysis?.parsed?.message_id || '<20260907131930.9842.vps@vps-bulletproof-node.ru>' },
              { label: 'Reply-To', val: displayAnalysis?.parsed?.reply_to?.raw || 'marcus.vance.exec@mail-consulting.ru' },
              { label: 'Return-Path', val: displayAnalysis?.parsed?.return_path?.raw || '<bounce-daemon@vps-bulletproof-node.ru>' },
            ].map(item => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/60 gap-1">
                <span className="text-slate-500 font-semibold w-24 shrink-0">{item.label}:</span>
                <span className="text-slate-200 truncate flex-1">{item.val}</span>
                <button
                  onClick={() => handleCopy(item.label, item.val)}
                  className="text-slate-500 hover:text-slate-300 self-end sm:self-auto"
                >
                  {copiedKey === item.label ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication Protocols */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
            Cryptographic Authentication
          </span>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">SPF</div>
                <div className="text-[11px] text-slate-400">Sender Policy Framework</div>
              </div>
              <RiskBadge status={displayAnalysis?.auth?.spf?.status || 'Fail'} size="sm" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">DKIM</div>
                <div className="text-[11px] text-slate-400">DomainKeys Identified Mail</div>
              </div>
              <RiskBadge status={displayAnalysis?.auth?.dkim?.status || 'None'} size="sm" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">DMARC</div>
                <div className="text-[11px] text-slate-400">Domain Message Authentication</div>
              </div>
              <RiskBadge status={displayAnalysis?.auth?.dmarc?.status || 'Fail'} size="sm" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">Reply-To Alignment</div>
                <div className="text-[11px] text-slate-400">Header Divergence Check</div>
              </div>
              <RiskBadge status={displayAnalysis?.auth?.alignment?.reply_to_match ? 'Pass' : 'Fail'} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Received Header Hop Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Received: Transmission Hops Table
        </h3>
        <HeaderTable hops={displayAnalysis?.relay_hops || []} />
      </div>

      {/* Raw Headers Explorer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Raw Headers List ({filteredHeaders.length})
          </span>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={headerSearch}
              onChange={e => setHeaderSearch(e.target.value)}
              placeholder="Search raw headers..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto font-mono text-xs">
          {filteredHeaders.map((hdr, i) => (
            <div key={i} className="py-2 flex items-start gap-2 hover:bg-slate-950/40 p-2 rounded">
              <span className="text-sky-400 font-bold shrink-0">{hdr.name}:</span>
              <span className="text-slate-300 break-all flex-1">{hdr.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
