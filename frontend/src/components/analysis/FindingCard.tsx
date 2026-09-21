import React, { useState } from 'react';
import { DetectionFinding } from '../../types';
import { RiskBadge } from '../shared/RiskBadge';
import { ChevronDown, ChevronUp, AlertCircle, FileCode, Check } from 'lucide-react';

interface FindingCardProps {
  finding: DetectionFinding;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${finding.title} - ${finding.explanation} (${finding.evidence_ref})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all hover:border-slate-700/80">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 cursor-pointer select-none group"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
          <div className="mt-0.5 shrink-0">
            <RiskBadge status={finding.severity} size="sm" />
          </div>
          <div className="flex flex-col min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300 transition-colors">
              {finding.title}
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {finding.explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-1 rounded border border-slate-800">
            {finding.evidence_ref}
          </span>
          <div className="rounded-lg p-1.5 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-sky-400" />
              Technical Telemetry & Evidence Details
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : null}
              {copied ? 'Copied' : 'Copy Ref'}
            </button>
          </div>

          <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
            {finding.details}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Reference Authority: <strong className="text-slate-300 font-mono">{finding.evidence_ref}</strong></span>
            <span className="text-slate-500 font-mono">Finding ID: {finding.id}</span>
          </div>
        </div>
      )}
    </div>
  );
};
