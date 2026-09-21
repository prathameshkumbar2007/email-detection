import React from 'react';
import { RelayHop } from '../../types';
import { Globe, Server, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RelayTimelineProps {
  hops: RelayHop[];
}

export const RelayTimeline: React.FC<RelayTimelineProps> = ({ hops }) => {
  if (!hops || hops.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500">
        No chronological relay hops parsed from Received: headers.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 backdrop-blur-sm overflow-x-auto">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs">
        <span className="font-mono uppercase font-bold text-slate-300">
          Chronological Transmission Relay Sequence
        </span>
        <span className="text-slate-400 font-mono text-[11px]">
          Origin Node → Perimeter MX Gateway
        </span>
      </div>

      <div className="flex items-center gap-3 min-w-max py-3">
        {hops.map((hop, idx) => {
          const isOrigin = idx === 0;
          const isFinal = idx === hops.length - 1;

          return (
            <React.Fragment key={hop.hop_number || idx}>
              <div
                className={`relative flex flex-col rounded-xl border p-3.5 min-w-[200px] max-w-[220px] transition-all shadow-md ${
                  hop.is_suspicious
                    ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                    : isOrigin
                    ? 'border-amber-500/30 bg-amber-950/10 text-slate-200'
                    : isFinal
                    ? 'border-sky-500/30 bg-sky-950/10 text-slate-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
                  <span className="font-bold text-slate-400">HOP #{hop.hop_number || idx + 1}</span>
                  {isOrigin && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold text-[10px]">
                      ORIGIN
                    </span>
                  )}
                  {isFinal && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-semibold text-[10px]">
                      BORDER MX
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-100">
                  <Server className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{hop.ip}</span>
                </div>

                <div className="mt-1 text-[11px] text-slate-400 truncate">
                  {hop.city ? `${hop.city}, ${hop.country}` : hop.country || 'Unknown Location'}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Delay: +{hop.delay_seconds || 0}s</span>
                  {hop.is_suspicious ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Flagged
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {!isFinal && (
                <div className="flex flex-col items-center justify-center text-slate-600 px-1">
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5">relay</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
